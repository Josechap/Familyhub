const express = require('express');
const router = express.Router();
const { getAuthenticatedClient } = require('../lib/googleAuth');

// Google Photos Library API base URL
const PHOTOS_API_BASE = 'https://photoslibrary.googleapis.com/v1';

// GET /status - Check if Photos scope is available
router.get('/status', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.json({ connected: false, hasPhotosScope: false });
        }

        // Log token info for debugging
        const tokenPreview = auth.credentials.access_token?.substring(0, 20) + '...';
        console.log('Photos status check using token:', tokenPreview);
        console.log('Token expiry:', new Date(auth.credentials.expiry_date).toISOString());

        // Try to access Photos API to check if scope is granted
        const response = await fetch(`${PHOTOS_API_BASE}/albums?pageSize=1`, {
            headers: {
                'Authorization': `Bearer ${auth.credentials.access_token}`,
            },
        });

        if (response.ok) {
            res.json({ connected: true, hasPhotosScope: true });
        } else if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.error?.message || '';
            console.log('Photos API 403 response:', errorData);

            // Check if API needs to be enabled
            if (errorMessage.includes('has not been used in project') || errorMessage.includes('is disabled')) {
                res.json({
                    connected: true,
                    hasPhotosScope: false,
                    needsApiEnabled: true,
                    message: 'Enable Photos Library API in Google Cloud Console'
                });
            } else {
                res.json({ connected: true, hasPhotosScope: false });
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.log('Photos API error response:', response.status, errorData);
            res.json({ connected: false, hasPhotosScope: false });
        }
    } catch (error) {
        console.error('Photos status error:', error);
        res.json({ connected: false, hasPhotosScope: false });
    }
});

// GET /albums - List user's albums
router.get('/albums', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const albums = [];
        let nextPageToken = null;

        // Fetch all albums (paginated)
        do {
            const url = new URL(`${PHOTOS_API_BASE}/albums`);
            url.searchParams.set('pageSize', '50');
            if (nextPageToken) {
                url.searchParams.set('pageToken', nextPageToken);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${auth.credentials.access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to fetch albums');
            }

            const data = await response.json();
            if (data.albums) {
                albums.push(...data.albums.map(album => ({
                    id: album.id,
                    title: album.title,
                    itemCount: parseInt(album.mediaItemsCount) || 0,
                    coverUrl: album.coverPhotoBaseUrl,
                    type: 'album',
                })));
            }
            nextPageToken = data.nextPageToken;
        } while (nextPageToken);

        // Also fetch shared albums
        try {
            const sharedResponse = await fetch(`${PHOTOS_API_BASE}/sharedAlbums?pageSize=50`, {
                headers: {
                    'Authorization': `Bearer ${auth.credentials.access_token}`,
                },
            });

            if (sharedResponse.ok) {
                const sharedData = await sharedResponse.json();
                if (sharedData.sharedAlbums) {
                    albums.push(...sharedData.sharedAlbums.map(album => ({
                        id: album.id,
                        title: `${album.title} (Shared)`,
                        itemCount: parseInt(album.mediaItemsCount) || 0,
                        coverUrl: album.coverPhotoBaseUrl,
                        type: 'shared',
                    })));
                }
            }
        } catch (err) {
            // Ignore shared albums error
        }

        res.json(albums.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (error) {
        console.error('Albums fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /album/:id - Get photos from a specific album
router.get('/album/:id', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const { id } = req.params;
        const photos = [];
        let nextPageToken = null;

        // Fetch photos from album (paginated, max 100 for screensaver)
        do {
            const response = await fetch(`${PHOTOS_API_BASE}/mediaItems:search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.credentials.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    albumId: id,
                    pageSize: 100,
                    pageToken: nextPageToken || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to fetch photos');
            }

            const data = await response.json();
            if (data.mediaItems) {
                // Filter to only photos (not videos)
                const photoItems = data.mediaItems
                    .filter(item => item.mimeType?.startsWith('image/'))
                    .map(item => ({
                        id: item.id,
                        baseUrl: item.baseUrl,
                        width: item.mediaMetadata?.width,
                        height: item.mediaMetadata?.height,
                        creationTime: item.mediaMetadata?.creationTime,
                    }));
                photos.push(...photoItems);
            }
            nextPageToken = data.nextPageToken;

            // Limit to 100 photos for screensaver
            if (photos.length >= 100) break;
        } while (nextPageToken);

        res.json(photos.slice(0, 100));
    } catch (error) {
        console.error('Photos fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

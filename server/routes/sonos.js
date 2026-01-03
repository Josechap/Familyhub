const express = require('express');
const router = express.Router();
const { SonosManager } = require('@svrooij/sonos');

const manager = new SonosManager();

// Initialize discovery
manager.InitializeWithDiscovery(10)
    .then(() => {
        console.log('Sonos discovery started');
        manager.Devices.forEach(device => {
            console.log(`Found device: ${device.Name} (${device.Host})`);
        });
    })
    .catch(console.error);

// Helper to find device by IP
const getDevice = (ip) => {
    return manager.Devices.find(d => d.Host === ip);
};

// GET / - List all found devices
router.get('/', (req, res) => {
    const devices = manager.Devices.map(d => {
        // Check if this device is a coordinator
        const isCoordinator = d.Coordinator.Host === d.Host;

        return {
            ip: d.Host,
            name: d.Name,
            group: d.GroupName,
            isCoordinator: isCoordinator,
            coordinatorIp: d.Coordinator.Host,
            volume: d.Volume,
            muted: d.Muted,
            state: d.CurrentTransportState
        };
    });

    res.json(devices);
});

// GET /:ip/play - Play
router.get('/:ip/play', async (req, res) => {
    const device = getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        await device.Play();
        res.json({ status: 'playing' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /:ip/pause - Pause
router.get('/:ip/pause', async (req, res) => {
    const device = getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        await device.Pause();
        res.json({ status: 'paused' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /:ip/next - Next Track
router.get('/:ip/next', async (req, res) => {
    const device = getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        await device.Next();
        res.json({ status: 'next' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /:ip/previous - Previous Track
router.get('/:ip/previous', async (req, res) => {
    const device = getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        await device.Previous();
        res.json({ status: 'previous' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /:ip/volume/:level - Set Volume
router.get('/:ip/volume/:level', async (req, res) => {
    console.log(`[Sonos] Volume request: IP=${req.params.ip}, Level=${req.params.level}`);
    const device = getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const level = parseInt(req.params.level);
    if (isNaN(level) || level < 0 || level > 100) {
        return res.status(400).json({ error: 'Invalid volume level' });
    }

    try {
        // Use RenderingControlService for volume control
        await device.RenderingControlService.SetVolume({
            InstanceID: 0,
            Channel: 'Master',
            DesiredVolume: level
        });
        console.log(`[Sonos] Set volume to ${level} on ${device.Name}`);
        res.json({ status: 'volume set', level });
    } catch (error) {
        console.error('[Sonos Volume Error]', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /:ip/state - Get detailed state (track, volume, etc)
router.get('/:ip/state', async (req, res) => {
    const device = getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        // Fetch volume
        const volume = await device.RenderingControlService.GetVolume({ InstanceID: 0, Channel: 'Master' });

        // Fetch transport state
        const transportInfo = await device.AVTransportService.GetTransportInfo({ InstanceID: 0 });

        // Fetch position info (includes track metadata)
        const positionInfo = await device.AVTransportService.GetPositionInfo({ InstanceID: 0 });

        // Fetch media info for additional metadata
        const mediaInfo = await device.AVTransportService.GetMediaInfo({ InstanceID: 0 });

        console.log(`[Sonos Debug] Device: ${device.Name}`);
        console.log(`[Sonos Debug] Volume: ${JSON.stringify(volume)}`);
        console.log(`[Sonos Debug] Transport: ${JSON.stringify(transportInfo)}`);
        console.log(`[Sonos Debug] Position: ${JSON.stringify(positionInfo)}`);
        console.log(`[Sonos Debug] Media: ${JSON.stringify(mediaInfo)}`);

        // Extract track metadata from position info
        const trackMeta = positionInfo.TrackMetaData;
        let title = 'Unknown';
        let artist = 'Unknown';
        let album = '';
        let art = null;

        // TrackMetaData might be a DIDL-Lite XML string or parsed object
        if (trackMeta && typeof trackMeta === 'object') {
            title = trackMeta.Title || trackMeta['dc:title'] || 'Unknown';
            artist = trackMeta.Artist || trackMeta['dc:creator'] || trackMeta.Creator || 'Unknown';
            album = trackMeta.Album || trackMeta['upnp:album'] || '';
            art = trackMeta.AlbumArtUri || trackMeta['upnp:albumArtURI'] || null;
        } else if (trackMeta && typeof trackMeta === 'string' && trackMeta !== 'NOT_IMPLEMENTED') {
            // Try to parse basic info from the string
            // The library should parse it, but if not, we can try simple extraction
            console.log('[Sonos Debug] TrackMetaData is a string:', trackMeta.substring(0, 200));
        }

        res.json({
            volume: volume.CurrentVolume,
            state: transportInfo.CurrentTransportState,
            track: {
                title: title,
                artist: artist,
                album: album,
                art: art,
                duration: positionInfo.TrackDuration,
                position: positionInfo.RelTime,
                uri: positionInfo.TrackURI
            }
        });
    } catch (error) {
        console.error('[Sonos Error]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

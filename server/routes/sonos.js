const express = require('express');
const router = express.Router();

let manager = null;
let discoveryStarted = false;
let discoveryError = null;

const isSonosEnabled = () => process.env.SONOS_ENABLED === 'true';

const getManager = async () => {
    if (!isSonosEnabled()) {
        discoveryError = 'Sonos integration is disabled. Set SONOS_ENABLED=true to enable discovery.';
        return null;
    }

    if (!manager) {
        const { SonosManager } = require('@svrooij/sonos');
        manager = new SonosManager();
    }

    if (!discoveryStarted) {
        discoveryStarted = true;
        try {
            await manager.InitializeWithDiscovery(Number(process.env.SONOS_DISCOVERY_TIMEOUT || 10));
            discoveryError = null;
            console.log('Sonos discovery started');
            manager.Devices.forEach(device => {
                console.log(`Found device: ${device.Name} (${device.Host})`);
            });
        } catch (error) {
            discoveryError = error.message;
            console.error('Sonos discovery unavailable:', error.message);
        }
    }

    return manager;
};

const getDevice = async (ip) => {
    const activeManager = await getManager();
    return activeManager?.Devices?.find(d => d.Host === ip) || null;
};

const unavailablePayload = () => [];

router.get('/', async (req, res) => {
    try {
        const activeManager = await getManager();
        if (!activeManager) {
            return res.json(unavailablePayload());
        }

        const devices = activeManager.Devices.map(d => {
            const isCoordinator = d.Coordinator?.Host === d.Host;

            return {
                ip: d.Host,
                name: d.Name,
                group: d.GroupName,
                isCoordinator,
                coordinatorIp: d.Coordinator?.Host || d.Host,
                volume: d.Volume,
                muted: d.Muted,
                state: d.CurrentTransportState,
            };
        });

        res.json(devices);
    } catch (error) {
        discoveryError = error.message;
        res.json(unavailablePayload());
    }
});

router.get('/:ip/play', async (req, res) => {
    const device = await getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        await device.Play();
        res.json({ status: 'playing' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:ip/pause', async (req, res) => {
    const device = await getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        await device.Pause();
        res.json({ status: 'paused' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:ip/next', async (req, res) => {
    const device = await getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        await device.Next();
        res.json({ status: 'next' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:ip/previous', async (req, res) => {
    const device = await getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        await device.Previous();
        res.json({ status: 'previous' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:ip/volume/:level', async (req, res) => {
    const device = await getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const level = parseInt(req.params.level, 10);
    if (isNaN(level) || level < 0 || level > 100) {
        return res.status(400).json({ error: 'Invalid volume level' });
    }

    try {
        await device.RenderingControlService.SetVolume({
            InstanceID: 0,
            Channel: 'Master',
            DesiredVolume: level,
        });
        res.json({ status: 'volume set', level });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:ip/state', async (req, res) => {
    const device = await getDevice(req.params.ip);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    try {
        const volume = await device.RenderingControlService.GetVolume({ InstanceID: 0, Channel: 'Master' });
        const transportInfo = await device.AVTransportService.GetTransportInfo({ InstanceID: 0 });
        const positionInfo = await device.AVTransportService.GetPositionInfo({ InstanceID: 0 });
        const mediaInfo = await device.AVTransportService.GetMediaInfo({ InstanceID: 0 });
        const trackMeta = positionInfo.TrackMetaData;
        let title = 'Unknown';
        let artist = 'Unknown';
        let album = '';
        let art = null;

        if (trackMeta && typeof trackMeta === 'object') {
            title = trackMeta.Title || trackMeta['dc:title'] || 'Unknown';
            artist = trackMeta.Artist || trackMeta['dc:creator'] || trackMeta.Creator || 'Unknown';
            album = trackMeta.Album || trackMeta['upnp:album'] || '';
            art = trackMeta.AlbumArtUri || trackMeta['upnp:albumArtURI'] || null;
        }

        res.json({
            volume: volume.CurrentVolume,
            state: transportInfo.CurrentTransportState,
            track: {
                title,
                artist,
                album,
                art,
                duration: positionInfo.TrackDuration,
                position: positionInfo.RelTime,
                uri: positionInfo.TrackURI,
            },
            media: {
                currentURI: mediaInfo.CurrentURI,
                currentURIMetaData: mediaInfo.CurrentURIMetaData,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

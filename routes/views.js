const fs = require('fs');
const path = require('path');
const express = require('express');

const mime = require('mime-types');

const router = express.Router();

router.get('/', (req, res) => {
    let mediasDirectories = process.env['MEDIAS_DIRECTORIES'].split(':');
    const directories = mediasDirectories.map((dir, index) => ({url: '/media/' + index, name: path.basename(dir)})) ;
    res.render('groups-list', {directories})
});

router.get('/video/:dir_id/', (req, res) => {
    let mediasDirectories = process.env['MEDIAS_DIRECTORIES'].split(':');
    const group = mediasDirectories[req.params['dir_id']];
    const subdir = req.query['subdir'] || '';

    const finalGroup = path.dirname(path.join(group, subdir));
    const dirs = fs.readdirSync(finalGroup).map((dirName) => path.join(finalGroup, dirName));
    const subtitles = dirs.reduce((array, filePath) => {
        const mimeType = mime.lookup(filePath);
        if(fs.statSync(filePath).isFile() && mimeType === "application/x-subrip") {
            array.push({
                url: '/api/subtitle/' + req.params['dir_id'] + "/?subdir=" + path.join(path.dirname(subdir), path.basename(filePath)),
                label: path.basename(filePath)
            });
        }
        return array;
    }, []);
    
    const fileUrl = '/api/media/' + req.params['dir_id'] + '/?subdir=' + subdir;
    const mimeType = mime.lookup(fileUrl);
    if(mimeType.includes("video"))
        mediaType = 'video';
    else if(mimeType.includes("audio"))
        mediaType = 'audio';

    res.render('media', {
        Url: fileUrl,
        type: mediaType,
        subtitles,
        title: path.basename(subdir)
    });
});

router.get('/:dir_id/', (req, res) => {
    let mediasDirectories = process.env['MEDIAS_DIRECTORIES'].split(':');
    const group = mediasDirectories[req.params['dir_id']];
    const subdir = req.query['subdir'] || '';

    const finalGroup = path.join(group, subdir);
    const dirs = fs.readdirSync(finalGroup).map((dirName) => path.join(finalGroup, dirName));

    const directories = dirs.reduce((array, filePath) => {
        try {
            if (fs.statSync(filePath).isDirectory()) {
                array.push({
                    url: '/media/' + req.params['dir_id'] + '/?subdir=' + path.join(subdir, path.basename(filePath)),
                    name: path.basename(filePath)
                });
            }
        } catch (ignore) {}
        return array;
    }, []);
    let url = ('/media/' + req.params['dir_id'] + '/?subdir=' + subdir).split('/');
    url.pop();
    directories.push({
        url: url.join('/'),
        name: '...'
    });
    const files = dirs.reduce((array, filePath) => {
        try {
            const mimeType = mime.lookup(filePath);
            if (fs.statSync(filePath).isFile() && mimeType && (mimeType.includes("video") || mimeType.includes("audio"))) {
                array.push({
                    url: '/media/video/' + req.params['dir_id'] + '?subdir=' + path.join(subdir, path.basename(filePath)),
                    name: path.basename(filePath)
                });
            }
        } catch (ignore) {}
        return array;
    }, []);
    res.render('files-list', {
        directories, 
        files
    });
});

module.exports.router = router;
module.exports.path = '/media';

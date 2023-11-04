const fs = require('fs');
const { generateAPIReponse } = require('../utils/response');

module.exports = {
    
    deleteFileFromPath(req, res) {
        const folderName = req.params.folder;
        const fileName = req.params.filename;
        try {
            fs.unlinkSync(`uploads/${folderName}/${fileName}`);
            return res.status(200).send(generateAPIReponse(0,'File deleted successfully'));
        } catch (error) {
            console.log('deleteFileFromPath error =>', error.message, error.code);
            if (error.code == 'ENOENT')
                return res.status(404).send(generateAPIReponse(1,'No such file found'));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    }
}
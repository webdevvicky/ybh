const FavouriteFolders = require('../../models/favourite_folders');
const { generateAPIReponse } = require('../../utils/response');
const { deleteFavouriteFolderItems } = require('../../controllers/customer/customer_favourites');

module.exports = {
    createFavouriteFolder(req, res) {
        console.log('createFavouriteFolder id =>', req.user.id, 'params =>', req.body);
        const params = req.body;
        params.customer_id = req.user.id;
        const newFolder = new FavouriteFolders(params);
        newFolder.save()
            .then(async (result) => {
                return res.status(200).send(generateAPIReponse(0,'Favourite folder created successfully', result));
            })
            .catch((error) => {
                console.log('createFavouriteFolder error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            });
    },

    getMyFavouriteFolderList(req, res) {
        console.log('getMyFavouriteFolderList id =>', req.user.id);
        FavouriteFolders.find({ customer_id: req.user.id }).then(folders => {
            return res.status(200).send(generateAPIReponse(0,'Favourite folder list fetched successfully', folders));
        }).catch(error => {
            console.log('getMyFavouriteFolderList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    updateFavouriteFolderById(req, res) {
        const params = req.body;
        console.log('updateFavouriteFolderById id =>', req.params.id, 'params =>', params);
        FavouriteFolders.findByIdAndUpdate(req.params.id, params, { new: true }).then(folder => {
            return res.status(200).send(generateAPIReponse(0,'Favourite folder updated successfully', folder));
        }).catch(error => {
            console.log('updateFavouriteFolderById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    deleteFavouriteFolderById(req, res) {
        console.log('deleteFavouriteFolderById id =>', req.params.id);
        FavouriteFolders.findByIdAndDelete(req.params.id).then(async (folder) => {
            try {
                await deleteFavouriteFolderItems(req.params.id);
                return res.status(200).send(generateAPIReponse(0,'Favourite folder deleted successfully', folder));
            } catch (error) {
                console.log('deleteFavouriteFolderItems error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
        }).catch(error => {
            console.log('deleteFavouriteFolderById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    }
}
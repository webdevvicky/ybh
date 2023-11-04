const Reviews = require('../../models/reviews');
const Bookings = require('../../models/bookings');
const { generateAPIReponse } = require('../../utils/response');
var _ = require('lodash');
const { getQueryProject } = require('../../utils/functions');

module.exports = {
    async getMyReviews(req, res) {
        console.log('getMyReviews customer id =>', req.user.id);
        const totalReviews = await Reviews.count();
        Reviews.find({ reviewer: req.user.id }).populate('reviewee', 'salon_name logo formatted_address slug').lean().then(givenReviews => {
            givenReviews.map(x => {
                if (x.active_status) {
                    switch (true) {
                        case x.active_status == '0':
                         x['status'] = {
                            "name": "pending",
                            "display_name": "Pending",
                            "value": "0"
                        };
                         break;
                        case x.active_status == '1':
                         x['status'] = {
                            "name": "approved",
                            "display_name": "Approved",
                            "value": "1"
                        };
                         break;
                        case x.active_status == '2':
                         x['status'] =  {
                            "name": "declined",
                            "display_name": "Declined",
                            "value": "2"
                        };
                         break;
                        case x.active_status == '3':
                         x['status'] =  {
                            "name": "deleted",
                            "display_name": "Deleted",
                            "value": "3"
                        };
                         break;
                        default: 
                        break;
                    }
                }
                return x;
            });
            const givenReviewsVendorIds = givenReviews.map(item => {
                return item.reviewee._id
            })
            Bookings.find({
                $and: [
                    { customer: req.user.id },
                    { vendor: { $nin: givenReviewsVendorIds } },
                    { 'status': 'finished' }
                ]
            }, getQueryProject([
                '_id', 'vendor'
            ])).populate('vendor', 'salon_name logo formatted_address slug').then(reviewsToGive => {
                const uniqVendors = _.uniqBy(reviewsToGive, 'vendor')
                return res.status(200).send(generateAPIReponse(0,'Reviews fetched successfully', { given_reviews: givenReviews, reviews_to_give: uniqVendors, total_reviews: totalReviews }));
            }).catch(error => {
                console.log('getMyReviews error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }).catch(error => {
            console.log('getMyReviews error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    addReview(req, res) {
        const params = req.body;
        console.log('addReview params', params);
        params['reviewer'] = req.user.id;
        const newReview = new Reviews(params);
        newReview.save().then(review => {
            return res.status(200).send(generateAPIReponse(0,'Review Added successfully', review));
        }).catch((error) => {
            console.log('addReview error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        });
    },

    isReviewGivenToVendor(req, res) {
        console.log('isReviewGivenToVendor customer id =>', req.user.id, 'params =>', req.body);
        Reviews.exists({
            $and: [
                { reviewer: req.user.id },
                { reviewee: req.body.vendor_id }
            ]
        }).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Is review given to vendor', result));
        }).catch(error => {
            console.log('isReviewGivenToVendor error =>', error.message);
            return res.status(200).send(generateAPIReponse(0,'Is review given to vendor', false));
        })
    },
}
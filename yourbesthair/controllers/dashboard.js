const { generateAPIReponse } = require('../utils/response');
const Vendors = require('../models/vendors');
const Customers = require('../models/customers');
const Bookings = require('../models/bookings');

module.exports = {
    async getDashboardTotalCounts(req, res) {
        const queryParams = req.query;
        let _query = { "active_status": { "$ne": "3" } };
        let fromDate = queryParams.fromDate && queryParams.fromDate != 'null' && queryParams.fromDate != 'undefined' ? queryParams.fromDate: null;
        let toDate = queryParams.toDate && queryParams.toDate != 'null' && queryParams.toDate != 'undefined' ? new Date(queryParams.toDate): null;
        if (fromDate && toDate) {
         toDate = queryParams.fromDate == queryParams.toDate?toDate.setDate(toDate.getDate() + 1) : toDate;
         _query = { ..._query, updated_at: { $gte: new Date(fromDate).toISOString(), $lte: new Date(toDate).toISOString()  }
         }
        }
        
        console.log('getDashboardTotalCounts');
        try {
            const counts = await Promise.all([
                Customers.aggregate(
                    [{
                       $match: _query
                    }, {
                 $group: {
                    _id: null,
                    COUNT: {
                       $sum: 1
                    }
                 }
                 }]
                 ),
                 Vendors.aggregate(
                    [{
                       $match: {
                        updated_at: {
                            $gte: new Date(fromDate).toISOString(),
                             $lte: new Date(toDate).toISOString()
                          },
                          "active_status": { "$ne": "3" } 
                       }
                    }, {
                 $group: {
                    _id: null,
                    COUNT: {
                       $sum: 1
                    }
                 }
                 }]
                 ),
                 Bookings.aggregate(
                    [{
                       $match: {
                        created_at: {
                            $gte: new Date(fromDate).toISOString(),
                             $lte: new Date(toDate).toISOString()
                          },
                          "active_status": { "$ne": "3" } 
                       }
                    }, {
                 $group: {
                    _id: null,
                    COUNT: {
                       $sum: 1
                    }
                 }
                 }]
                 ),
                Bookings.aggregate([{
                        $match: {
                            created_at: {
                                $gte: new Date(fromDate).toISOString(),
                                $lte: new Date(toDate).toISOString()
                             },
                            "payment_status.name": { "$eq": "1" }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total_revenue: { $sum: "$amount" },
                        }
                    },
                ])
            ]).then(result => {
                return result
            })
            console.log("counts >>>>>>>>>>>>",counts)
            const response = {
                'customers': counts[0],
                'vendors': counts[1],
                'bookings': counts[2],
                'revenue':  counts[3].length>0?counts[3][0].total_revenue:[]
            }
            return res.status(200).send(generateAPIReponse(0,'Total counts', response));
        } catch (error) {
            console.log('getDashboardTotalCounts error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    }
}
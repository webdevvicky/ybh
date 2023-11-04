module.exports = {
    getBookingsByServiceNameQuery(matchQuery) {
        return [{
                $lookup: {
                    from: 'services',
                    let: { "serviceId": "$services" },
                    as: 'services',
                    "pipeline": [
                        {
                            $match: {
                                "$expr": { "$eq": ["$_id", "$$serviceId"] },
        
                            }
                        },
                        { "$project": { "name": 1 }}
                    ],
                }
            },
            {
                $match: matchQuery
            }
        ]
    },

    getBookingsByCustomerMatchQuery(matchQuery) {
        return [{
                $lookup: {
                    from: 'customers',
                    let: { "customerId": "$customer" },
                    as: 'customer',
                    "pipeline": [
                        {
                            $match: {
                                "$expr": { "$eq": ["$_id", "$$customerId"] },
        
                            }
                        },
                        { "$project": { "full_name": 1 }}
                    ],
                }
            },
            {
                $unwind: '$customer'
            },
            {
                $match: matchQuery
            }
        ]
    },

    getBookingsByVendorMatchQuery(matchQuery) {
        return [{
                $lookup: {
                    from: 'vendors',
                    let: { "vendorId": "$vendor" },
                    as: 'vendor',
                    "pipeline": [{
                            $match: {
                                "$expr": { "$eq": ["$_id", "$$vendorId"] },
        
                            }
                        },
                        { "$project": { "salon_name": 1 }}
                    ],
                }
            },
            {
                $unwind: '$vendor'
            },
            {
                $match: matchQuery
            }
        ]
    }
}
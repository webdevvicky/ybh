module.exports = {
    getVendorsByCategorySlugQuery(categoryId, page, limit) {
        const skips = Number(limit) * Number(page);
        return [
			{
				$match: {
					"$and": [
						{
							"$or": [
								{
									"categories": {
										"$in": [categoryId]
									}
								},
								{
									"sub_categories": {
										"$in": [categoryId]
									}
								}
							]
						},
						{
							"active_status": "1"
						}
					]
				}
			},
			{
				$lookup: {
					from: "vendor_services",
					let: { "vendorId": "$_id" },
					as: "services",
					pipeline: [
						{
							$match: {
								"$expr": { "$eq": ["$vendor", "$$vendorId"] }
							}
						},
						{
							$lookup: {
								from: "services",
								let: { "serviceId": "$service" },
								pipeline: [
									{
										$match: {
											"$expr": { "$eq": ["$_id", "$$serviceId"] }
										}
									},
									{
										$project: {
											name: 1,
										}
									},
								],
								as: "services"
							}
						},
						{ $limit: 3 },
						{
							$replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$services", 0] }, "$$ROOT"] } }
						},
						{ $unwind: "$services" },
						{ $project: { services: 0, vendor: 0, created_at: 0, updated_at: 0, __v: 0, _id: 0 } },
					]
				}
			},
			{
                $lookup: {
                    from: "reviews",
                    let: { "vendorId": "$_id" },
                    as: "reviews",
                    pipeline: [
						{
                            $match: {
                                "$expr": { "$eq": ["$reviewee", "$$vendorId"] }
                            }
                        },
                        {
                            $group: {
                                _id: { post: "$reviewee", rating: "$ratings" },
                                count: { $sum: 1 },
                                reviews: { $push: "$$ROOT" },
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.post",
                                counts: { $push: { rating: "$_id.rating", count: "$count" } },
                                reviews: { $push: "$reviews" },
                                avgRating: {
                                    $avg: "$_id.rating"
                                },
                            }
                        },
                        {
                            $project: {
                                _id: "$_id",
                                avg_rating: "$avgRating",
                                counts: "$counts"
                            }
                        },
                    ]
                }
            },
            {
                $unwind: {
                    path: "$reviews",
                    preserveNullAndEmptyArrays: true
                }
            },
			{
				"$project": {
					email_verification_token: 0, is_email_verified: 0, password: 0, __v: 0
				}
			},
			{
                $facet: {
                    paginated_result: [{ $skip: skips }, { $limit: Number(limit) }],
                    total_count: [
                      {
                        $count: 'count'
                      }
                    ]
                  }
            }
		]
    }
}
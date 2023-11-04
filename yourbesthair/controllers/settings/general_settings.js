const GeneralSettings = require("../../models/general_settings");
const TaxRule = require("../../models/tax_rules");
const AssignTax = require("../../models/assign_taxes");
const VendorServices = require("../../models/vendor_services");
const VendorSettings = require("../../models/vendor_Settings");
const multer = require("multer");
const { generateAPIReponse } = require("../../utils/response");
const { getQueryProject } = require("../../utils/functions");
const mongoose = require("mongoose");

module.exports = {
  async saveGeneralSettingInfo(req, res) {
    const params = req.body;
    const id = req.params.id;

    console.log(params);

    if (id) {
      let idToMatch;
      let updateDocument = params;
      if (params.email_settings) {
        console.log("1");
        const emailSettingsData =
          (await GeneralSettings.findOne().select("email_settings")) || [];
        const emailSettings = emailSettingsData.email_settings;
        if (emailSettings && emailSettings.length > 0) {
          console.log("2");
          if (params.email_settings._id) {
            console.log("3");
            emailSettings.forEach((item, index) => {
              if (item._id == params.email_settings._id) {
                console.log("4");
                emailSettings[index] = params.email_settings;
              } else {
                console.log("5");
                emailSettings[index]["is_enabled"] = false;
              }
            });
          } else {
            console.log("6");
            emailSettings.forEach((item, index) => {
              emailSettings[index]["is_enabled"] = false;
            });
            emailSettings.push(params.email_settings);
          }
          updateDocument = {
            $set: {
              email_settings: emailSettings,
            },
          };
        } else {
          console.log("7");
          updateDocument = {
            $push: params,
          };
        }
      }
      if (params.tax_settings) {
        console.log("8");
        if (params.tax_settings._id) {
          console.log("9");
          idToMatch["tax_settings._id"] = params.tax_settings._id;
          updateDocument = {
            $set: {
              "tax_settings.$": params.tax_settings,
            },
          };
        } else {
          console.log(params);
          updateDocument = {
            $push: params,
          };
        }
      }
      GeneralSettings.findOneAndUpdate(idToMatch, updateDocument, { new: true })
        .then((result) => {
          return res
            .status(200)
            .send(
              generateAPIReponse("General settings saved successfully", result)
            );
        })
        .catch((error) => {
          console.log("saveGeneralSettingInfo error =>", error.message);
          return res.status(500).send(generateAPIReponse(1,error.message));
        });
    } else {
      console.log("11");
      const genralSettingsData = new GeneralSettings(params);
      genralSettingsData
        .save()
        .then((result) => {
          res
            .status(200)
            .send(
              generateAPIReponse("General settings saved successfully", result)
            );
        })
        .catch((error) => {
          console.log("saveGeneralSettingInfo error =>", error.message);
          return res.status(500).send(generateAPIReponse(1,error.message));
        });
    }
  },

  getTaxIdentifier(req, res) {
    //res.send("get TaxIdentifier");
    GeneralSettings.findOne()
      .select("tax_settings")
      .then(async (taxSettings) => {
        res
          .status(200)
          .send(
            generateAPIReponse(
              "Tax settings fetched successfully",
              taxSettings.tax_settings
            )
          );
      })
      .catch((error) => {
        console.log("getTaxSettingList error =>", error.message);
        return res.status(500).send(generateAPIReponse(1,error.message));
      });
  },

  getTaxRule(req, res) {
    GeneralSettings.findOne()
      .select("tax_settings")
      .then(async (taxSettings) => {
        TaxRule.find()
          .populate("services")
          .lean()
          .then(async (taxRules) => {
            taxRules.forEach((taxRule) => {
              const newTaxRate = [];
              taxRule.tax_rate.forEach((it) => {
                const mTax = taxSettings.tax_settings.find(
                  (i) => i._id.toString() == it.toString()
                );
                if (mTax !== null && mTax !== undefined) newTaxRate.push(mTax);
              });
              taxRule.tax_rate = newTaxRate;
            });

            res
              .status(200)
              .send(
                generateAPIReponse("Tax rule fetched successfully", taxRules)
              );
          })
          .catch((error) => {
            console.log("getTaxRuleList error =>", error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
          });
      })
      .catch((error) => {
        console.log("getTaxRuleList error =>", error.message);
        return res.status(500).send(generateAPIReponse(1,error.message));
      });
  },

  getAssignTax(req, res) {
    GeneralSettings.findOne()
      .select("tax_settings")
      .then(async (taxSettings) => {
        AssignTax.find()
          .populate("services") 
          .lean()
          .then(async (assigntax) => {
            assigntax.forEach((tax) => {
              const mTax = taxSettings.tax_settings.find(
                (i) => i._id.toString() == tax.general_settings.toString()
              );
              if (mTax !== null && mTax !== undefined)
                tax.general_settings = mTax;
            });

            res
              .status(200)
              .send(
                generateAPIReponse("Assign Tax fetched successfully", assigntax)
              );
          })
          .catch((error) => {
            console.log("getAssign TaxList error =>", error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
          });
      })
      .catch((error) => {
        console.log("getTaxRuleList error =>", error.message);
        return res.status(500).send(generateAPIReponse(1,error.message));
      });
  },

  uploadStoreAssets(req, res) {
    const assets = req.files;
    const id = req.params.id;
    console.log("uploadStoreAssets files =>", assets, "Id =>", id);
    if (!assets) {
      return res.status(404).send(generateAPIReponse(1,"No files Available"));
    } else {
      let dataToUpdate = {};
      if (assets.store_logo) {
        dataToUpdate["logos.store_logo"] = getAssetObjectForDB(
          assets.store_logo[0]
        );
      }
      if (assets.admin_logo) {
        dataToUpdate["logos.admin_logo"] = getAssetObjectForDB(
          assets.admin_logo[0]
        );
      }
      if (assets.vendor_logo) {
        dataToUpdate["logos.vendor_logo"] = getAssetObjectForDB(
          assets.vendor_logo[0]
        );
      }
      if (assets.email_template_logo) {
        dataToUpdate["logos.email_template_logo"] = getAssetObjectForDB(
          assets.email_template_logo[0]
        );
      }
      if (assets.invoice_logo) {
        dataToUpdate["logos.invoice_logo"] = getAssetObjectForDB(
          assets.invoice_logo[0]
        );
      }
      if (assets.store_icon) {
        dataToUpdate["logos.store_icon"] = getAssetObjectForDB(
          assets.store_icon[0]
        );
      }
      GeneralSettings.updateOne({ _id: id }, dataToUpdate, { new: true })
        .then((settings) => {
          res
            .status(200)
            .send(generateAPIReponse("Assets uploaded successfully", settings));
        })
        .catch((error) => {
          console.log("uploadStoreAssets error =>", error.message);
          return res.status(500).send(generateAPIReponse(1,error.message));
        });
    }
  },

  getGenralSettingsDetails(req, res) {
    console.log("getGenralSettingsDetails");
    GeneralSettings.findOne()
      .select("store_info logos seo social_links")
      .then(async (settings) => {
        res
          .status(200)
          .send(
            generateAPIReponse(
              "General settings fetched successfully",
              settings
            )
          );
      })
      .catch((error) => {
        console.log("getGenralSettingsDetails error =>", error.message);
        return res.status(500).send(generateAPIReponse(1,error.message));
      });
  },

  getEmailSettings(req, res) {
    console.log("getEmailSettings");
    GeneralSettings.findOne()
      .select("email_settings")
      .then(async (settings) => {
        res
          .status(200)
          .send(
            generateAPIReponse("Email settings fetched successfully", settings)
          );
      })
      .catch((error) => {
        console.log("getEmailSettings error =>", error.message);
        return res.status(500).send(generateAPIReponse(1,error.message));
      });
  },

  getEmailConfigDBCall() {
    console.log("getEmailConfig");
    return new Promise((resolve, reject) => {
      GeneralSettings.findOne()
        .select("email_settings")
        .then(async (settings) => {
          let result;
          settings.email_settings.filter((item) => {
            if (item.is_enabled == true) {
              result = item;
            }
          });
         // console.log("email setting config result",result);
          resolve(result);
        })
        .catch((error) => {
          console.log("getEmailSettings error =>", error.message);
          reject(error);
        });
    });
  },

  getTaxSettingList(req, res) {
    console.log("getTaxSettingList");
    GeneralSettings.findOne()
      .select("tax_settings")
      .then(async (taxSettings) => {
        res
          .status(200)
          .send(
            generateAPIReponse(
              "Tax settings fetched successfully",
              taxSettings.tax_settings
            )
          );
      })
      .catch((error) => {
        console.log("getTaxSettingList error =>", error.message);
        return res.status(500).send(generateAPIReponse(1,error.message));
      });
  },

  async deleteTaxZoneRateById(req, res) {
    const id = req.params.id;
    try {
      GeneralSettings.findOneAndUpdate(
        { _id: id },
        { $set: { "tax_settings.$.isDelete": true } },
        { returnOriginal: false },
        function (TaxSettingItems) {
          return res
            .status(200)
            .send(
              generateAPIReponse("Tax setting item deleted successfully..!!")
            );
        }
      );
    } catch (error) {
      console.log("deleteTaxSettingItemById error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async storeTaxRule(req, res) {
    const params = req.body;
    console.log("createTaxRule params", params);
    try {
      const taxRule = await createTaxRuleDBCall(params);
      params.tax_rule_id = req.body.tax_rule_id;
      params.isDeleted = false;
      res
        .status(200)
        .send(generateAPIReponse("Tax Rule created successfully", taxRule));
    } catch (error) {
      console.log("createtaxRule error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async storeAssignTax(req, res) {
    const params = req.body;
    console.log("createAssignTax params", params);
    try {
      const assignTax = await createAssignTaxDBCall(params);
      params.assign_tax_id = req.body.assign_tax_id;
      params.isDeleted = false;
      res
        .status(200)
        .send(generateAPIReponse("Assign Tax created successfully", assignTax));
    } catch (error) {
      console.log("createAssignTax error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async getTaxZoneDetailsForCustomer(req, res) {
    const params = req.body;
    const settingId = req.params.setting_id;
    console.log(
      "getTaxZoneDetailsForCustomer params =>",
      params,
      "settingId =>",
      settingId
    );
    try {
      let _params = { country: params.country, state: params.state}
      const result = await findTaxZoneDetailsOfCustomerRegion(
        settingId,
        _params
      );
      let final_result = [];
      let tax = result && result.tax_settings ? result.tax_settings : null;
      final_result = await findProductDetails(params.services, tax)
      return res
        .status(200)
        .send(
          generateAPIReponse(
            "Tax setting item fetched successfully",
            final_result
          )
        );
    } catch (error) {
      console.log("getTaxZoneDetailsForCustomer error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async updateTaxZoneById(req, res) {
    const params = req.body;
    const id = req.params.id;
    console.log("Update Tax Zone id =>", id, "params =>", params);
    try {
      const updateTaxZoneData = await updateTaxZoneByIdDBCall(params, id);
      return res
        .status(200)
        .send(
          generateAPIReponse("Tax Zone updated successfully", updateTaxZoneData)
        );
    } catch (error) {
      console.log("update Tax Zone error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async deleteTaxZoneById(req, res) {
    const params = req.body;
    const id = req.params.id;
    console.log("delete Tax Zone id =>", id, "params =>", params);
    try {
      const deleteTaxZoneData = await deleteTaxZoneByIdDBCall(params, id);
      return res
        .status(200)
        .send(
          generateAPIReponse("Tax Zone deleted successfully", deleteTaxZoneData)
        );
    } catch (error) {
      console.log("delete Tax Zone error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async updateTaxRuleById(req, res) {
    const params = req.body;
    const id = req.params.id;
    console.log("Update Tax Rule id =>", id, "params =>", params);
    try {
      const updateTaxRuleData = await updateTaxRuleByIdDBCall(params, id);
      return res
        .status(200)
        .send(
          generateAPIReponse("Tax Rule updated successfully", updateTaxRuleData)
        );
    } catch (error) {
      console.log("update Tax Rule error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async updateAssignTaxById(req, res) {
    const params = req.body;
    const id = req.params.id;
    console.log("Update Assign Tax id =>", id, "params =>", params);
    try {
      const updateAssignTaxData = await updateAssignTaxByIdDBCall(params, id);
      return res
        .status(200)
        .send(
          generateAPIReponse(
            "Assign Tax updated successfully",
            updateAssignTaxData
          )
        );
    } catch (error) {
      console.log("update Tax Rule error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async deleteTaxRuleById(req, res) {
    const id = req.params.id;
    try {
      TaxRule.findOneAndUpdate(
        { _id: id },
        { $set: { isDeleted: true } },
        { returnOriginal: false },
        function (taxrules) {
          return res
            .status(200)
            .send(generateAPIReponse("Tax Rule deleted successfully..!!"));
        }
      );
    } catch (error) {
      console.log("deleteTaxRuleById error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  async deleteAssignTaxById(req, res) {
    const id = req.params.id;
    try {
      AssignTax.findOneAndUpdate(
        { _id: id },
        { $set: { isDeleted: true } },
        { returnOriginal: false },
        function (assigntax) {
          return res
            .status(200)
            .send(generateAPIReponse("Assign Tax deleted successfully..!!"));
        }
      );
    } catch (error) {
      console.log("deleteAssignTaxById error =>", error.message);
      return res.status(500).send(generateAPIReponse(1,error.message));
    }
  },

  getTaxRuleDetailsById(req, res) {
    const id = req.params.id;
    GeneralSettings.findOne()
      .select("tax_settings")
      .then(async (taxSettings) => {
        TaxRule.findOne({ _id: id })
          .populate("services")
          .lean()
          .then(async (taxRules) => {
            const newTaxRate = [];
            taxRules.tax_rate.forEach((it) => {
              const mTax = taxSettings.tax_settings.find(
                (i) => i._id.toString() == it.toString()
              );
              if (mTax !== null && mTax !== undefined) newTaxRate.push(mTax);
            });
            taxRules.tax_rate = newTaxRate;
            res
              .status(200)
              .send(
                generateAPIReponse("Tax rule fetched successfully", taxRules)
              );
          })
          .catch((error) => {
            console.log("getTaxRuleList error =>", error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
          });
      })
      .catch((error) => {
        console.log("getTaxRuleList error =>", error.message);
        return res.status(500).send(generateAPIReponse(1,error.message));
      });
  },

  getAssignTaxDetailsById(req, res) {
    const id = req.params.id;
    GeneralSettings.findOne()
      .select("tax_settings")
      .then(async (taxSettings) => {
        AssignTax.findOne({ _id: id })
          .populate("services")
          .lean()
          .then(async (assigntax) => {
            const mTax = taxSettings.tax_settings.find(
              (i) => i._id.toString() == assigntax.general_settings.toString()
            );
            if (mTax !== null && mTax !== undefined)
              assigntax.general_settings = mTax;
            res
              .status(200)
              .send(
                generateAPIReponse(
                  "Assign Tax details fetched successfully",
                  assigntax
                )
              );
          })
          .catch((error) => {
            console.log("get Assign Tax Details error =>", error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
          });
      })
      .catch((error) => {
        console.log("getTaxDetails error =>", error.message);
        return res.status(500).send(generateAPIReponse(1,error.message));
      });
  },
};

const adminStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/store_assets");
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}`);
  },
});

module.exports.uploadAdminConfig = multer({ storage: adminStorage });

function getAssetObjectForDB(item) {
  return {
    url: `${item.path}`,
    file_name: item.filename,
  };
}

function createTaxRuleDBCall(params) {
  return new Promise(async (resolve, reject) => {
    const newTaxRule = new TaxRule(params);
    newTaxRule
      .save()
      .then(async (taxRule) => {
        resolve(taxRule);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function createAssignTaxDBCall(params) {
  return new Promise(async (resolve, reject) => {
    const newAssignTax = new AssignTax(params);
    newAssignTax
      .save()
      .then(async (assignTax) => {
        resolve(assignTax);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function findTaxZoneDetailsOfCustomerRegion(settingId, params) {
  return new Promise(async (resolve, reject) => {
    try {
      let result;
      result = await getCustomerTaxZoneDetailsDBCallQuery(settingId, {
        $and: [
          { 'tax_settings.tax_zone_country': { $regex: "^" + params.country + "$", $options: 'i' } },
          { 'tax_settings.tax_zone_state': { $regex: "^" + params.state + "$", $options: 'i' } },
        ],
      });
      if (result == null) {
        result = await getCustomerTaxZoneDetailsDBCallQuery(settingId, {
          $and: [
            { 'tax_settings.tax_zone_country': { $regex: "^" + params.country + "$", $options: 'i' } },
            { 'tax_settings.tax_zone_state': { $exists: false } },
          ],
        });
      }
      if (result == null) {
        result = await getCustomerTaxZoneDetailsDBCallQuery(settingId, {
          'tax_settings.tax_zone_country': "All Countries",
        });
      }
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

async function findProductDetails(service = [], tax = []) {
  console.log("tax --------------------------------", JSON.stringify(tax));
  return new Promise(async (resolve, reject) => {
    let serviceIds = service.map(x => mongoose.Types.ObjectId(x.id));
    let products = await VendorServices.find({ _id: { $in: serviceIds } }).populate([
      {
        path: 'service',
        populate: [{ path: 'tax_rule' }]
      }
    ]).lean().exec();
    if (products && products.length) {
      products = products.map(x => {
        let _tempTaxRule = x.service && x.service.tax_rule ? x.service.tax_rule: null;
        let _serviceCount = service.find(y => y.id && y.id.toString() == x._id.toString());
        let _tax = 0, _price = 0, _toTax = 0, _finalTax = [];
        if (x.price) {
          _price = Number(x.price)
          if (_serviceCount) {
            _price = _price * (_serviceCount.count ? Number(_serviceCount.count): 1)
          }
        }
        if (_tempTaxRule && !_tempTaxRule.isDeleted && _tempTaxRule.tax_rate) {
          let _actualRate = _tempTaxRule.tax_rate || [];
          _actualRate.forEach(element => {
            let _taxRate = tax && tax.length ? tax.find(p => p._id && p._id.toString() == element.toString()): null;
            let _totalTax = {}
            let _tax_rate = _taxRate && _taxRate.tax_rate? Number(_taxRate.tax_rate): 0
            let _tax_desc = _taxRate && _taxRate.tax_rate_description? _taxRate.tax_rate_description: null
            _totalTax['tax_rate'] = _tax_rate;
            _totalTax['tax_rate_description'] = _tax_desc;
            _tax = (_price * _tax_rate) / 100;
            _toTax += _tax;
            _totalTax['tax'] = _tax;
            _finalTax.push(_totalTax)
          })
        }
        x['applied_tax'] = _finalTax
        x['quantity'] = (_serviceCount.count ? Number(_serviceCount.count): 1);
        x['name'] = x.service && x.service.name ? x.service.name: ''; 
        x['taxable'] = _toTax;
        x['price'] = _price;
        x['total'] = _price + _toTax;
        return x;
      })
      let _vendor_settings = await VendorSettings.findOne({}, { commission_value: 1 }).sort({ updated_at: -1, created_at: -1 }).lean().exec();
      _vendor_settings = _vendor_settings && _vendor_settings.commission_value ? parseFloat(_vendor_settings.commission_value)/100 : 0;
      let total = products.reduce((sum, x) => { return sum + (x.total ? Number(x.total): 0) }, 0);
      let taxableValue = products.reduce((sum, x) => { return sum + (x.price ? Number(x.price): 0) }, 0);
      let totalTax = products.reduce((sum, x) => { return sum + (x.taxable ? Number(x.taxable): 0) }, 0);
      let commission = taxableValue * _vendor_settings;
      commission = Number(parseFloat(commission).toFixed(2))
      let estimatedSellerTotal = total // - commission;
      let _finalRes = { services: products, expenditure: { total, taxableValue, totalTax, commission, estimatedSellerTotal } }
      resolve(_finalRes)
    } else {
      resolve({ services: [], expenditure: { total: 0, taxableValue: 0, totalTax: 0, commission: 0, estimatedSellerTotal: 0 } })
    }
  })
};

function getCustomerTaxZoneDetailsDBCallQuery(settingId, query) {
  return new Promise((resolve, reject) => {
    console.log("query ------------------", JSON.stringify(query));
    let _query = { ...query, _id: settingId, 'tax_settings.isDeleted': false }
    GeneralSettings.findOne(_query)
      .then((result) => {
        if (result && result.tax_settings && result.tax_settings.length) {
          resolve(result);
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function updateTaxZoneByIdDBCall(params, id) {
  const tax_zone_country = params.tax_settings.tax_zone_country;
  const tax_rate_description = params.tax_settings.tax_rate_description;
  const tax_zone_state = params.tax_settings.tax_zone_state;
  const tax_zip_code = params.tax_settings.tax_zip_code;
  const tax_rate = params.tax_settings.tax_rate;
  const tax_zip_post_range = params.tax_settings.tax_zip_post_range;

  return new Promise(async (resolve, reject) => {
    GeneralSettings.findOneAndUpdate(
      { tax_settings: { $elemMatch: { _id: id } } },
      {
        $set: {
          "tax_settings.$.tax_zone_country": tax_zone_country,
          "tax_settings.$.tax_rate_description": tax_rate_description,
          "tax_settings.$.tax_zone_state": tax_zone_state,
          "tax_settings.$.tax_zip_code": tax_zip_code,
          "tax_settings.$.tax_rate": tax_rate,
          "tax_settings.$.tax_zip_post_range": tax_zip_post_range,
        },
      },
      { multi: true }
    )
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function deleteTaxZoneByIdDBCall(params, id) {
  return new Promise(async (resolve, reject) => {
    // Check taxRule
    const taxRule = await TaxRule.findOne({
      tax_rate: id,
      isDeleted: false
    });
    //console.log(taxRule);
    if (taxRule !== null && taxRule !== undefined) {
      //throw error
      reject(new Error("Sorry..! This Tax zone is already in used."));
    } else {
      // delete tax zone
      GeneralSettings.findOne()
        .then((data) => {
          // Update Taxsettings
          const tax = data.tax_settings.find(
            (it) => it._id.toString() == id.toString()
          );
          if (tax !== null && tax !== undefined) tax.isDeleted = true;
          data.markModified("tax_settings");
          GeneralSettings.findOneAndUpdate({ _id: data._id }, data)
            .then((savedData) => {
              resolve(savedData);
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          reject(error);
        });
    }
    // Check assignTax
  });
}

function updateTaxRuleByIdDBCall(params, id) {
  return new Promise(async (resolve, reject) => {
    TaxRule.findOneAndUpdate({ _id: id }, params, {
      new: true,
      useFindAndModify: false,
    })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function updateAssignTaxByIdDBCall(params, id) {
  return new Promise(async (resolve, reject) => {
    AssignTax.findOneAndUpdate({ _id: id }, params, {
      new: true,
      useFindAndModify: false,
    })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

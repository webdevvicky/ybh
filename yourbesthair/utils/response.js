module.exports = {
	//iserror:1 - APi Response with error | iserror:0 - No error in API response.
	generateAPIReponse(iserror, msg, data, status) {
		return { error:iserror, message: msg, data: data, status:status };
	}
};
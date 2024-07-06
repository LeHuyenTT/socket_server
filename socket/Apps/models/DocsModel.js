var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var DocsModel = new Schema({
	nameDoc: { type: String, required: true, unique: true },
	url: { type: String, required: true, unique: true },
	type: { type: String, enum: ["PPTX", "PDF", "DOCX"], default: "PDF", required: true },
	author: {
		type: Schema.Types.ObjectId,
		// required: true, 
		ref: "UserModel"
	},
}, { timestamps: true });

module.exports = mongoose.model("DocsModel", DocsModel);

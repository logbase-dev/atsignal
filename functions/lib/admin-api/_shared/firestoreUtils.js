"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTimestamp = convertTimestamp;
exports.normalizeLocalizedField = normalizeLocalizedField;
exports.removeUndefinedFields = removeUndefinedFields;
const firestore_1 = require("firebase-admin/firestore");
function convertTimestamp(value) {
    if (!value)
        return undefined;
    if (value instanceof firestore_1.Timestamp)
        return value.toDate();
    if (value?.toDate instanceof Function)
        return value.toDate();
    if (value instanceof Date)
        return value;
    return undefined;
}
function normalizeLocalizedField(field) {
    if (!field)
        return { ko: "" };
    return { ko: field.ko ?? "", ...(field.en ? { en: field.en } : {}) };
}
function removeUndefinedFields(obj) {
    const cleaned = {};
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined)
            cleaned[k] = v;
    });
    return cleaned;
}
//# sourceMappingURL=firestoreUtils.js.map
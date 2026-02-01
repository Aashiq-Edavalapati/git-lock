
import * as PayoutModel from '../models/payoutModel.js';

export const getPayouts = async (req, res) => {
    try {
        const methods = await PayoutModel.getPayoutMethods(req.user.id);
        res.json(methods);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch payout methods" });
    }
};

export const addPayout = async (req, res) => {
    try {
        const { type, details } = req.body;
        if (!type || !details) return res.status(400).json({ error: "Missing fields" });
        
        const newMethod = await PayoutModel.addPayoutMethod(req.user.id, type, details);
        res.json(newMethod);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to add payout method" });
    }
};

export const deletePayout = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PayoutModel.deletePayoutMethod(id, req.user.id);
        if (!deleted) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete" });
    }
};

export const setPrimary = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await PayoutModel.setPrimaryPayoutMethod(id, req.user.id);
        if (!updated) return res.status(404).json({ error: "Not found" });
        res.json(updated);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update" });
    }
};

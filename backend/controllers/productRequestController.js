import ProductRequest from "../models/ProductRequest.js";
import StoreProduct from "../models/StoreProduct.js";
import Product from "../models/Product.js";

export const createProductRequest = async (req, res) => {
    try {
        const { productId, supplyingStoreId, requestedQuantity } = req.body;
        const requestingStoreId = req.store.id;

        if (!productId || !supplyingStoreId || !requestedQuantity) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const request = await ProductRequest.create({
            requestingStore: requestingStoreId,
            supplyingStore: supplyingStoreId,
            product: productId,
            requestedQuantity,
        });

        res.status(201).json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while creating product request" });
    }
};

export const getProductRequests = async (req, res) => {
    try {
        const storeId = req.store.id;
        const isAdmin = req.store.type === "admin";

        const filter = isAdmin ? {} : {
            $or: [
                { requestingStore: storeId },
                { supplyingStore: storeId }
            ]
        };

        const requests = await ProductRequest.find(filter)
            .populate("requestingStore", "username address city state zipCode")
            .populate("supplyingStore", "username address city state zipCode")
            .populate("product", "name")
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while fetching product requests" });
    }
};

export const getProductRequestsSent = async (req, res) => {
    try {
        const storeId = req.store.id;
        const isAdmin = req.store.type === "admin";

        const filter = isAdmin ? {} : {
            $or: [
                { requestingStore: storeId }
            ]
        };

        const requests = await ProductRequest.find(filter)
            .populate("requestingStore", "username address city state zipCode")
            .populate("supplyingStore", "username address city state zipCode")
            .populate("product", "name")
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while fetching product requests" });
    }
};

export const getProductRequestsRecieved = async (req, res) => {
    try {
        const storeId = req.store.id;
        const isAdmin = req.store.type === "admin";

        const filter = isAdmin ? {} : {
            $or: [
                { supplyingStore: storeId }
            ]
        };

        const requests = await ProductRequest.find(filter)
            .populate("requestingStore", "username address city state zipCode")
            .populate("supplyingStore", "username address city state zipCode")
            .populate("product", "name")
            .sort({ createdAt: -1 });
            
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while fetching product requests" });
    }
};

export const acceptProductRequest = async (req, res) => {
    try {
        const { requestId, acceptedQuantity } = req.body;
        const storeId = req.store.id;

        const request = await ProductRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (request.supplyingStore.toString() !== storeId) {
            return res.status(403).json({ message: "Not authorized to accept this request" });
        }
        
        if (acceptedQuantity > request.requestedQuantity) {
            return res.status(403).json({ message: "Cannot assign more than requested" });
        }

        request.acceptedQuantity = acceptedQuantity;
        request.acceptedAt = new Date();
        request.status = 1;
        await request.save();

        // Deduct quantity from supplying store's stock
        const storeProduct = await StoreProduct.findOne({
            store: storeId,
            product: request.product,
        });

        // Add quantity from to request store's stock
        const storeProductReq = await StoreProduct.findOne({
            store: request.requestingStore,
            product: request.product,
        })

        if (!storeProduct || storeProduct.quantity < acceptedQuantity) {
            return res.status(400).json({ message: "Insufficient stock in supplying store" });
        }

        storeProduct.quantity -= acceptedQuantity;
        await storeProduct.save();

        storeProductReq.quantity += acceptedQuantity;
        await storeProductReq.save();

        res.json({ message: "Request accepted and stock updated", request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while accepting request" });
    }
};

// Reject a product request
export const rejectProductRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ message: "Request ID is required." });

    const request = await ProductRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found." });

    // Authorization: Only the supplying store or admin can reject
    if (
      request.supplyingStore.toString() !== req.store._id.toString()
    ) {
      return res.status(403).json({ message: "You are not authorized to reject this request." });
    }

    request.rejectedAt = new Date();
    request.status = 2;
    await request.save();

    res.json({ message: "Request rejected successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error rejecting request." });
  }
};

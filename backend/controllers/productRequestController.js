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

// export const getProductRequests = async (req, res) => {
//     try {
//         const storeId = req.store.id;
//         const isAdmin = req.store.type === "admin";

//         const filter = isAdmin ? {} : {
//             $or: [
//                 { requestingStore: storeId },
//                 { supplyingStore: storeId }
//             ]
//         };

//         const requests = await ProductRequest.find(filter)
//             .populate("requestingStore", "username address city state zipCode")
//             .populate("supplyingStore", "username address city state zipCode")
//             .populate("product", "name")
//             .sort({ createdAt: -1 });

//         res.json(requests);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error while fetching product requests" });
//     }
// };

export const getProductRequests = async (req, res) => {
  try {
    const storeId = req.store.id;
    const isAdmin = req.store.type === "admin";

    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const baseFilter = isAdmin
      ? {}
      : {
          $or: [
            { requestingStore: storeId },
            { supplyingStore: storeId }
          ]
        };

    const filter = { ...baseFilter };

    // IST time zone filtering on requestedAt
    if (startDate || endDate) {

      filter.requestedAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Set to midnight IST
        const istStart = new Date(start.getTime());
        filter.requestedAt.$gte = istStart;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day IST
        const istEnd = new Date(end.getTime());
        filter.requestedAt.$lte = istEnd;
      }
    }

    const total = await ProductRequest.countDocuments(filter);

    const requests = await ProductRequest.find(filter)
      .populate("requestingStore", "username address city state zipCode")
      .populate("supplyingStore", "username address city state zipCode")
      .populate("product", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      requests,
      totalRequests: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching product requests" });
  }
};


export const getProductRequestsSent = async (req, res) => {
    try {
        const storeId = req.store.id;
        const isAdmin = req.store.type === "admin";

        const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const baseFilter = isAdmin
        ? {}
        : {
            $or: [
                { requestingStore: storeId }
            ]
            };

        const filter = { ...baseFilter };

        // IST time zone filtering on requestedAt
        if (startDate || endDate) {

          filter.requestedAt = {};

          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Set to midnight IST
            const istStart = new Date(start.getTime());
            filter.requestedAt.$gte = istStart;
          }

          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day IST
            const istEnd = new Date(end.getTime());
            filter.requestedAt.$lte = istEnd;
          }
        }
        const total = await ProductRequest.countDocuments(filter);

        const requests = await ProductRequest.find(filter)
        .populate("requestingStore", "username address city state zipCode")
        .populate("supplyingStore", "username address city state zipCode")
        .populate("product", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        res.status(200).json({
        requests,
        totalRequests: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while fetching product requests" });
    }
};

export const getProductRequestsRecieved = async (req, res) => {
    try {
        const storeId = req.store.id;
        const isAdmin = req.store.type === "admin";

        const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const baseFilter = isAdmin
        ? {}
        : {
            $or: [
                { supplyingStore: storeId }
            ]
            };

        const filter = { ...baseFilter };

        // IST time zone filtering on requestedAt
        if (startDate || endDate) {

          filter.requestedAt = {};

          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Set to midnight IST
            const istStart = new Date(start.getTime());
            filter.requestedAt.$gte = istStart;
          }

          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day IST
            const istEnd = new Date(end.getTime());
            filter.requestedAt.$lte = istEnd;
          }
        }

        const total = await ProductRequest.countDocuments(filter);

        const requests = await ProductRequest.find(filter)
        .populate("requestingStore", "username address city state zipCode")
        .populate("supplyingStore", "username address city state zipCode")
        .populate("product", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        res.status(200).json({
        requests,
        totalRequests: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while fetching product requests" });
    }
};

// Accept a request and deduct stock from supplying store
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
      return res.status(400).json({ message: "Cannot assign more than requested" });
    }

    const storeProduct = await StoreProduct.findOne({
      store: storeId,
      product: request.product,
    });

    if (!storeProduct || storeProduct.quantity < acceptedQuantity) {
      return res.status(400).json({ message: "Insufficient stock in supplying store" });
    }

    request.acceptedQuantity = acceptedQuantity;
    request.acceptedAt = new Date();
    request.status = 1;
    await request.save();

    storeProduct.quantity -= acceptedQuantity;
    await storeProduct.save();

    res.json({ message: "Request accepted and stock updated", request });
  } catch (err) {
    console.error("acceptProductRequest error:", err);
    res.status(500).json({ message: "Server error while accepting request" });
  }
};

// Receive request and add stock to requesting store
export const recieveProductRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const storeId = req.store.id;

    const request = await ProductRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.requestingStore.toString() !== storeId) {
      return res.status(403).json({ message: "Not authorized to receive this request" });
    }

    request.status = 2;
    await request.save();

    let storeProduct = await StoreProduct.findOne({
      store: request.requestingStore,
      product: request.product,
    });

    if (!storeProduct) {
      // Create if it doesn't exist
      storeProduct = new StoreProduct({
        store: request.requestingStore,
        product: request.product,
        quantity: request.acceptedQuantity,
      });
    } else {
      storeProduct.quantity += request.acceptedQuantity;
    }

    await storeProduct.save();

    res.json({ message: "Request received and stock updated", request });
  } catch (err) {
    console.error("recieveProductRequest error:", err);
    res.status(500).json({ message: "Server error while receiving request" });
  }
};

// Cancel a request and return stock back to supplying store
export const cancelProductRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const storeId = req.store.id;

    const request = await ProductRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.supplyingStore.toString() !== storeId) {
      return res.status(403).json({ message: "Not authorized to cancel this request" });
    }

    const storeProduct = await StoreProduct.findOne({
      store: storeId,
      product: request.product,
    });

    if (!storeProduct) {
      return res.status(400).json({ message: "Supplying store product not found" });
    }

    storeProduct.quantity += request.acceptedQuantity;
    await storeProduct.save();

    request.rejectedAt = new Date();
    request.status = 3;
    await request.save();

    res.json({ message: "Request canceled and stock restored", request });
  } catch (err) {
    console.error("cancelProductRequest error:", err);
    res.status(500).json({ message: "Server error while canceling request" });
  }
};

// Reject a product request
export const rejectProductRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const storeId = req.store.id;

    if (!requestId) return res.status(400).json({ message: "Request ID is required." });

    const request = await ProductRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found." });

    if (request.supplyingStore.toString() !== storeId) {
      return res.status(403).json({ message: "Not authorized to reject this request." });
    }

    request.rejectedAt = new Date();
    request.status = 4;
    await request.save();

    res.json({ message: "Request rejected successfully." });
  } catch (err) {
    console.error("rejectProductRequest error:", err);
    res.status(500).json({ message: "Server error rejecting request." });
  }
};


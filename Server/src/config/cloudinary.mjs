import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Cloudinary config check:", {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? "Loaded" : "Missing",
    apiKey: process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing",
    apiSecret: process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing"
});
export default cloudinary;
import cloudinary from "../config/cloudinary.mjs";
import streamifier from "streamifier";

const uploadToCloudinary = (
    fileBuffer,
    {
        folder = "eventsphere/events",
        resourceType = "auto",
        publicId = undefined
    } = {}
) => {

    return new Promise((resolve, reject) => {

        const uploadOptions = {
            folder,
            resource_type: resourceType
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        const stream =
            cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {

                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

        streamifier
            .createReadStream(fileBuffer)
            .pipe(stream);
    });
};


// ==========================================
// DELETE FROM CLOUDINARY
// ==========================================

export const deleteFromCloudinary = async (
    publicId,
    resourceType = "image"
) => {

    if (!publicId) {
        return null;
    }

    return cloudinary.uploader.destroy(
        publicId,
        {
            resource_type: resourceType
        }
    );
};


export default uploadToCloudinary;
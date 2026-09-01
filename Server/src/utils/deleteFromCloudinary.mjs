import cloudinary from "../config/cloudinary.mjs";

const deleteFromCloudinary = async (
    publicId,
    resourceType = "raw"
) => {

    return new Promise((resolve, reject) => {

        cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: resourceType
            },
            (error, result) => {

                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }

            }
        );

    });

};

export default deleteFromCloudinary;
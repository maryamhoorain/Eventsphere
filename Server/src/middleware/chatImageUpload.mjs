import multer from "multer";

const storage = multer.memoryStorage();

const chatImageUpload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    },

    fileFilter: (req, file, cb) => {

        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, PNG, WEBP, and GIF images are allowed"
                )
            );
        }
    }
});

export default chatImageUpload;
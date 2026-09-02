import multer from "multer";

const storage = multer.memoryStorage();

const chatAudioUpload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    },

    fileFilter: (req, file, cb) => {

        const allowedMimeTypes = [
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "audio/x-wav",
            "audio/ogg",
            "audio/webm",
            "audio/mp4",
            "audio/aac"
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only supported audio files are allowed"
                )
            );
        }
    }
});

export default chatAudioUpload;
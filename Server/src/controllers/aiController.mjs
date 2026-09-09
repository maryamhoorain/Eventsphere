import generateAIResponse from "../services/aiService.mjs";

import detectAIIntent from "../services/aiIntentService.mjs";

import {
  buildAIContext,
} from "../services/aiContextService.mjs";


// ======================================================
// CHAT WITH AI
// ======================================================

const chatWithAI = async (req, res) => {

  try {

    const { message } = req.body;


    // ==================================================
    // VALIDATE MESSAGE
    // ==================================================

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {

      return res.status(400).json({
        success: false,
        message: "Message is required",
      });

    }


    const userMessage = message.trim();


    // ==================================================
    // GET AUTHENTICATED USER
    // ==================================================

    const userId =
      req.user?._id ||
      req.user?.id;

    const role =
      req.user?.role;


    if (!userId || !role) {

      return res.status(401).json({
        success: false,
        message:
          "User authentication information is missing",
      });

    }


    // ==================================================
    // DETECT INTENT
    // ==================================================

    const intent =
      detectAIIntent(userMessage);


    console.log(
      `AI Intent: ${intent}`
    );


    // ==================================================
    // BUILD ROLE-SPECIFIC CONTEXT
    // ==================================================

    const context =
      await buildAIContext({
        userId,
        role,
        intent,
      });


    // ==================================================
    // GENERATE AI RESPONSE
    // ==================================================

    const aiResponse =
      await generateAIResponse({

        question:
          userMessage,

        context,

        role,

        intent,

      });


    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res.status(200).json({

      success: true,

      message:
        "AI response generated successfully",

      data: {

        question:
          userMessage,

        intent,

        answer:
          aiResponse,

      },

    });

  } catch (error) {

    console.error(
      "AI controller error:",
      error
    );


    // ----------------------------------------------
    // Handle missing API configuration
    // ----------------------------------------------

    if (
      error.message ===
      "GROQ_API_KEY is missing"
    ) {

      return res.status(500).json({

        success: false,

        message:
          "AI service is not configured",

      });

    }


    // ----------------------------------------------
    // General AI error
    // ----------------------------------------------

    return res.status(500).json({

      success: false,

      message:
        "Unable to generate AI response",

    });

  }

};


export {
  chatWithAI,
};
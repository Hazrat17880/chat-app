import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    // User who owns this contact
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User being added as contact
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Custom display name
    customName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "blocked", "pending"],
      default: "active",
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },

    lastInteraction: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      default: "",
      maxlength: 200,
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate contacts
contactSchema.index(
  {
    userId: 1,
    contactId: 1,
  },
  {
    unique: true,
  }
);

// Virtual populate
contactSchema.virtual("contactDetails", {
  ref: "User",
  localField: "contactId",
  foreignField: "_id",
  justOne: true,
});

// ✅ FIXED: Removed 'next' parameter - using regular function
contactSchema.pre(/^find/, function() {
  this.populate({
    path: "contactDetails",
    select: "username email phone avatar online lastSeen bio",
  });
});

// ✅ FIXED: Pre-save hook - throw error directly
contactSchema.pre("save", function() {
  // Prevent adding self as contact
  if (this.userId.toString() === this.contactId.toString()) {
    throw new Error("You cannot add yourself as a contact");
  }
});

// Static method
contactSchema.statics.isContactExists = async function(userId, contactId) {
  return await this.exists({
    userId,
    contactId,
  });
};

const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

export default Contact;
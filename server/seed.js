const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Auth = require("./models/auth");
const Case = require("./models/case");
const Evidence = require("./models/evidence");
require("dotenv").config();

const users = [
    {
        name: "Lawyer One",
        userName: "lawyer1",
        email: "lawyer1@example.com",
        password: "Password123!",
        role: "LAWYER",
    },
    {
        name: "Forensic Pro",
        userName: "pro1",
        email: "pro1@example.com",
        password: "Password123!",
        role: "PROFESSIONAL",
    },
    {
        name: "Judge Alpha",
        userName: "judge1",
        email: "judge1@example.com",
        password: "Password123!",
        role: "JUDGE",
    },
    {
        name: "Citizen Viewer",
        userName: "public1",
        email: "public1@example.com",
        password: "Password123!",
        role: "PUBLIC",
    },
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        // 1. CLEAR COLLECTIONS
        console.log("Clearing existing data...");
        await Auth.deleteMany({});
        await Case.deleteMany({});
        await Evidence.deleteMany({});

        // 2. SEED USERS
        const seededUsers = [];
        for (const user of users) {
            const newUser = new Auth(user);
            await newUser.save();
            seededUsers.push(newUser);
            console.log(`Created user: ${user.email}`);
        }

        const lawyer = seededUsers.find(u => u.role === "LAWYER");
        const pro = seededUsers.find(u => u.role === "PROFESSIONAL");
        const judge = seededUsers.find(u => u.role === "JUDGE");
        const publicUser = seededUsers.find(u => u.role === "PUBLIC");

        // 3. SEED CASES
        console.log("Seeding dummy cases...");

        // Case 1: Open & Fresh
        const case1 = await Case.create({
            title: "Cyber Security Breach - TechCorp",
            description: "Investigation into a suspected data leakage at TechCorp headquarters. Lawyer assigned to represent the company.",
            caseNumber: "CASE-2026-001",
            status: "OPEN",
            createdBy: judge._id,
            assignedJudge: judge._id,
            assignedLawyers: [lawyer._id],
            assignedProfessionals: [pro._id],
            assignedPublicViewers: [publicUser._id],
            timeline: [
                {
                    date: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
                    status: "OPEN",
                    verdict: "Case registered and initial legal counsel assigned."
                }
            ]
        });

        // Case 2: Under Review (History)
        const case2 = await Case.create({
            title: "International Financial Dispute",
            description: "A complex case involving cross-border financial transactions and alleged fraudulent documents.",
            caseNumber: "CASE-2026-002",
            status: "UNDER_REVIEW",
            createdBy: judge._id,
            assignedJudge: judge._id,
            assignedLawyers: [lawyer._id],
            assignedProfessionals: [pro._id],
            assignedPublicViewers: [publicUser._id],
            timeline: [
                {
                    date: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
                    status: "UNDER_REVIEW",
                    verdict: "Preliminary evidence review initiated. Forensic professionals requested to verify transaction logs."
                },
                {
                    date: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
                    status: "OPEN",
                    verdict: "First hearing completed. Court orders detailed audit of digital assets."
                },
                {
                    date: new Date(Date.now() - 3600000 * 24 * 5), // 5 days ago
                    status: "OPEN",
                    verdict: "Case filed for international arbitration."
                }
            ]
        });

        // Case 3: Closed (Full History)
        const case3 = await Case.create({
            title: "Property Tax Evasion - City Real Estate",
            description: "Final hearing regarding the evasion of property taxes over the span of 5 years.",
            caseNumber: "CASE-2026-003",
            status: "CLOSED",
            createdBy: judge._id,
            assignedJudge: judge._id,
            assignedLawyers: [lawyer._id],
            assignedProfessionals: [pro._id],
            assignedPublicViewers: [publicUser._id],
            verdictText: "Judgment for the Plaintiff. The defendant is ordered to pay all back taxes plus a 15% penalty. Case closed.",
            closedAt: new Date(),
            timeline: [
                {
                    date: new Date(),
                    status: "CLOSED",
                    verdict: "Final judgment delivered: Defendant ordered to pay back taxes and penalties."
                },
                {
                    date: new Date(Date.now() - 3600000 * 24 * 10), // 10 days ago
                    status: "UNDER_REVIEW",
                    verdict: "Final summary of evidence presented to the bench."
                },
                {
                    date: new Date(Date.now() - 3600000 * 24 * 15), // 15 days ago
                    status: "UNDER_REVIEW",
                    verdict: "Cross-examination of financial records in progress."
                },
                {
                    date: new Date(Date.now() - 3600000 * 24 * 30), // 30 days ago
                    status: "OPEN",
                    verdict: "Initial summons issued to the city real estate group."
                }
            ]
        });

        // 4. SEED EVIDENCE
        console.log("Seeding dummy evidence...");
        await Evidence.create({
            case: case2._id,
            uploadedBy: lawyer._id,
            description: "Bank Statement - March 2025",
            displayName: "Bank_Statement_March.pdf",
            originalFileName: "Bank_Statement_March.pdf",
            fileUrl: "/uploads/dummy-file.pdf",
            filePath: "c:\\dummy\\path",
            mimeType: "application/pdf",
            category: "DOCUMENT",
            status: "VERIFIED",
            professionalComments: "Verified against transaction logs. Records are authentic.",
            sha256Hash: "d8e8f8c8d8e8f8c8d8e8f8c8d8e8f8c8d8e8f8c8d8e8f8c8d8e8f8c8d8e8f8c8"
        });

        await Evidence.create({
            case: case2._id,
            uploadedBy: lawyer._id,
            description: "CCTV Footage Snapshot",
            displayName: "Warehouse_Entry.jpg",
            originalFileName: "Warehouse_Entry.jpg",
            fileUrl: "/uploads/dummy-image.jpg",
            filePath: "c:\\dummy\\path",
            mimeType: "image/jpeg",
            category: "IMAGE",
            status: "UPLOADED",
            sha256Hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
        });

        console.log("Seeding complete");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
};

seedDB();

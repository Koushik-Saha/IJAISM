require('dotenv').config();
import { sendReviewerTempPasswordEmail, sendReviewerAssignmentEmail } from './lib/email/send';

async function run() {
    console.log("Testing Reviewer Emails...");
    const email = "koushik.saha666@gmail.com";

    console.log("1. Sending New User (Temp Password) Email...");
    const res1 = await sendReviewerTempPasswordEmail(
        email, 
        "Dr. New Reviewer", 
        "Advances in Quantum Computing architecture and cryptography", 
        "This is a dummy test abstract injection for the invitation workflow.", 
        "C5K", 
        "tempPass123!", 
        "REV-NEW-123"
    );
    console.log("Result:", res1);

    console.log("2. Sending Existing User (Assignment) Email...");
    // dueDate 3 weeks from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 21);
    
    const res2 = await sendReviewerAssignmentEmail(
        email, 
        "Dr. Existing Reviewer", 
        "Advances in Machine Learning, IoT and Data Security", 
        "This is an abstract added for the testing assignment. This paper explores various paradigms in IoT and Machine Learning for advanced information systems and big data security infrastructures.",
        "C5K", 
        dueDate, 
        "REV-EXISTING-123"
    );
    console.log("Result:", res2);
}

run();

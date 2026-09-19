import {Router} from "express";
import prisma from "../config/database.js";

const router = Router()

router.get("/", async(_req, res) => {
    try{
        const userCount = await prisma.user.count()

        res.json({
            status: "ok",
            database: "connected",
            users: userCount
        })
    }catch(error){
        console.error("Database Connection error:", error);
            
        res.status(500).json({
            status: "error",
            message: "Disconnected"
        })
    }
    
})

export default router
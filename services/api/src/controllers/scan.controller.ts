import type { Request, Response } from "express";

import { createScan,getRecentScans,getScanById } from "../services/scan.service.js";

export async function createScanController(req: Request, res: Response) {
    try{
        const scan = await createScan({
            userId: req.body.userId,
            imageUrl: req.body.imageUrl
        })

        res.status(201).json({
            status: "success",
            data: scan
        })
    }catch(error){
        console.error("Create scan error:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to create Scan"
        })
        
    }
}
export async function getScanController(req: Request<{ id: string }>,
  res: Response) {
    try{
        const scan = await getScanById(req.params.id)

        if(!scan){
            res.status(404).json({
                status: "error",
                message: "Scan not found"
            })

            return
        }

        res.json({
            status: "success",
            data: scan
        })
    }catch(error){
        console.error("Get scan error:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to retrieve Scan"
        })
        
    }
}

export async function getRecentScansController(_req: Request, res: Response) {
    try {
        const scans = await getRecentScans()

        res.json({
            status: "success",
            data: scans
        })
    } catch (error) {
        console.error("Get scans error:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to retrieve scans"
        })
        
    }
}
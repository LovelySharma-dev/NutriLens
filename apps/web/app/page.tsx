"use client"

import React, { useEffect, useState } from 'react'
type HealthResponse = {
    status: string
    service: string
  }
export default function Home() {

  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    fetch(`${apiUrl}/health`)
      .then(async (response) => {
        if(!response.ok){
          throw new Error("Backend request failed")
        }
        return response.json()
      }).then((data: HealthResponse) => {
        setHealth(data)
      }).catch(() => {
        setError("Could not connect to the NutriTrust Backend")
      })
  },[])
  return (
    <main style={{padding: "40px", fontFamily: "Arial"}}>
      <h1>NutriLens</h1>
      <p>Frontend and Backend connection test</p>

      {
        health && (
          <div>
            <p>Backend status: {health.status}</p>
            <p>Service: {health.service}</p>
          </div>
        )
      }
      {error && <p>{error}</p>}
    </main>
  )
}


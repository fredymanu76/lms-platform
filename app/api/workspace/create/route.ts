import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, sector, user_id } = body

    if (!name || !sector || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, sector, user_id" },
        { status: 400 }
      )
    }

    // Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from("orgs")
      .insert({
        name,
        sector,
        created_by: user_id,
      })
      .select()
      .single()

    if (orgError) {
      console.error("Error creating org:", orgError)
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      )
    }

    // Add user as organization owner
    const { error: memberError } = await supabaseAdmin
      .from("org_members")
      .insert({
        org_id: org.id,
        user_id: user_id,
        role: "owner",
        status: "active",
      })

    if (memberError) {
      console.error("Error adding org member:", memberError)
      // Try to clean up the org
      await supabaseAdmin.from("orgs").delete().eq("id", org.id)
      return NextResponse.json(
        { error: "Failed to add user to organization" },
        { status: 500 }
      )
    }

    return NextResponse.json({ org_id: org.id }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

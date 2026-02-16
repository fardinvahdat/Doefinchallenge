export async function uploadFileToFilebase(
  file: File,
): Promise<{ cid: string; url: string }> {
  debugger;
  const sanitizedName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-\.]/g, "");

  // Filebase RPC API (Kubo-compatible)
  const RPC_ENDPOINT = "https://rpc.filebase.io/api/v0/add";
  const RPC_KEY =
    "MzVERkQyMkY0Rjk3MDY4REU2NkY6Zk1XcXFZQWFsWXd0ZnFrMElNb3RhQmtuWExicFBaMVNwQ0t1dFhJbjpkb2VmaW4="; // Your provided key

  try {
    const formData = new FormData();
    formData.append("file", file, sanitizedName); // Preserve original name in IPFS

    const response = await fetch(RPC_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RPC_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RPC upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    // For single file: result.Hash is the CID
    const cid = result.Hash;
    if (
      !cid ||
      !/^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafybei[A-Za-z0-9]{44}$/.test(cid)
    ) {
      throw new Error(`Invalid CID from RPC: ${cid}`);
    }

    const url = `https://ipfs.filebase.io/ipfs/${cid}`;

    console.log("📤 IPFS RPC Upload successful:", {
      cid,
      url,
      name: result.Name,
    });

    return { cid, url };
  } catch (error) {
    console.error("Upload error details:", error);
    throw new Error(
      `File upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

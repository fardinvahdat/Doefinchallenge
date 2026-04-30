const filebaseApiKey = import.meta.env.VITE_FILEBASE_API_KEY || "";

export async function uploadFileToFilebase(
  file: File,
): Promise<{ cid: string; url: string }> {
  const sanitizedName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-\.]/g, "");

  // Filebase RPC API (Kubo-compatible)
  const RPC_ENDPOINT = "https://rpc.filebase.io/api/v0/add";
  const RPC_KEY = filebaseApiKey;

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
    // CIDv0: Qm + 44 base58 chars (46 total)
    // CIDv1: bafy + 55+ base32 chars (59+ total); use loose lower-bound of 52 chars after prefix
    if (
      !cid ||
      !/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[A-Za-z0-9]{52,})$/.test(cid)
    ) {
      throw new Error(`Invalid CID from RPC: ${cid}`);
    }

    const url = `https://ipfs.filebase.io/ipfs/${cid}`;

    return { cid, url };
  } catch (error) {
    throw new Error(
      `File upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

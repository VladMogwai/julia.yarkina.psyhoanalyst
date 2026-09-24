import type { SupabaseClient } from "@supabase/supabase-js";

/** Uploads an image to the public `media` bucket and returns its public URL. */
export async function uploadImage(supabase: SupabaseClient, folder: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
  });
  if (error) throw new Error(`Не удалось загрузить картинку: ${error.message}`);

  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

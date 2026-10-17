// The Meta account token is stored encrypted with Windows DPAPI on Windows and in
// the Keychain on macOS. It is only passed to the backend process, never to the launcher UI.
use std::path::Path;

const FILE: &str = "meta-session.dpapi";
#[cfg(target_os = "macos")]
const SERVICE: &str = "com.refract.launcher";
#[cfg(target_os = "macos")]
const USER: &str = "meta-session";

#[cfg(target_os = "macos")]
pub fn load(_dir: &Path) -> Option<String> {
    let entry = keyring::Entry::new(SERVICE, USER).ok()?;
    entry.get_password().ok()
}

#[cfg(not(target_os = "macos"))]
pub fn load(dir: &Path) -> Option<String> {
    let data = std::fs::read(dir.join(FILE)).ok()?;
    String::from_utf8(unprotect(&data)?).ok()
}

#[cfg(target_os = "macos")]
pub fn store(_dir: &Path, token: Option<&str>) -> Result<(), String> {
    let entry = keyring::Entry::new(SERVICE, USER).map_err(|e| e.to_string())?;
    match token {
        Some(token) => entry.set_password(token).map_err(|e| e.to_string()),
        None => {
            let _ = entry.delete_credential();
            Ok(())
        }
    }
}

#[cfg(not(target_os = "macos"))]
pub fn store(dir: &Path, token: Option<&str>) -> Result<(), String> {
    let file = dir.join(FILE);
    let Some(token) = token else {
        return match std::fs::remove_file(&file) {
            Err(error) if error.kind() != std::io::ErrorKind::NotFound => Err(error.to_string()),
            _ => Ok(()),
        };
    };
    let data = protect(token.as_bytes()).ok_or("Windows credential encryption is unavailable.")?;
    let temporary = dir.join(format!("{FILE}.tmp"));
    std::fs::write(&temporary, data).and_then(|_| std::fs::rename(&temporary, &file)).map_err(|e| e.to_string())
}

#[cfg(windows)]
fn crypt(input: &[u8], encrypt: bool) -> Option<Vec<u8>> {
    use windows_sys::Win32::Foundation::LocalFree;
    use windows_sys::Win32::Security::Cryptography::{
        CryptProtectData, CryptUnprotectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
    };
    let blob_in = CRYPT_INTEGER_BLOB { cbData: u32::try_from(input.len()).ok()?, pbData: input.as_ptr() as *mut u8 };
    let mut blob_out = CRYPT_INTEGER_BLOB { cbData: 0, pbData: std::ptr::null_mut() };
    // SAFETY: the input blob outlives the call; the output buffer is copied and then freed with LocalFree.
    unsafe {
        let ok = if encrypt {
            CryptProtectData(&blob_in, std::ptr::null(), std::ptr::null(), std::ptr::null(), std::ptr::null(), CRYPTPROTECT_UI_FORBIDDEN, &mut blob_out)
        } else {
            CryptUnprotectData(&blob_in, std::ptr::null_mut(), std::ptr::null(), std::ptr::null(), std::ptr::null(), CRYPTPROTECT_UI_FORBIDDEN, &mut blob_out)
        };
        if ok == 0 || blob_out.pbData.is_null() {
            return None;
        }
        let output = std::slice::from_raw_parts(blob_out.pbData, blob_out.cbData as usize).to_vec();
        LocalFree(blob_out.pbData as _);
        Some(output)
    }
}

#[cfg(windows)]
fn protect(data: &[u8]) -> Option<Vec<u8>> { crypt(data, true) }
#[cfg(windows)]
fn unprotect(data: &[u8]) -> Option<Vec<u8>> { crypt(data, false) }

// Other non-Windows, non-macOS platforms are only used for UI development: keep the session in memory.
#[cfg(not(windows))]
fn protect(_: &[u8]) -> Option<Vec<u8>> { None }
#[cfg(not(windows))]
fn unprotect(_: &[u8]) -> Option<Vec<u8>> { None }

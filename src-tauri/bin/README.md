# Llama Server Sidecar

To complete the setup, please download the latest `llama-server` Windows executable from the [llama.cpp releases page](https://github.com/ggerganov/llama.cpp/releases).

1. Download the `*-bin-win-vulkan-x64.zip` or `*-bin-win-cu12.2-x64.zip` (if you have Nvidia).
2. Extract the archive.
3. Find `llama-server.exe` and place it in this folder.
4. Rename it to exactly `llama-server-x86_64-pc-windows-msvc.exe` so Tauri can find it during the build process.

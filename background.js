// 缓存书签数据
let cachedBookmarks = null;

// 更新书签缓存
async function updateBookmarkCache() {
    const bookmarks = await chrome.bookmarks.getTree();
    cachedBookmarks = bookmarks;
    // 将书签数据存储到 storage
    await chrome.storage.local.set({ bookmarks: bookmarks });
}

// 监听书签变化
chrome.bookmarks.onCreated.addListener(updateBookmarkCache);
chrome.bookmarks.onRemoved.addListener(updateBookmarkCache);
chrome.bookmarks.onChanged.addListener(updateBookmarkCache);
chrome.bookmarks.onMoved.addListener(updateBookmarkCache);

// 初始化时更新缓存
updateBookmarkCache();

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getBookmarks') {
        // 如果缓存存在，直接返回缓存数据
        if (cachedBookmarks) {
            sendResponse({ bookmarks: cachedBookmarks });
        } else {
            // 如果缓存不存在，从 storage 获取
            chrome.storage.local.get(['bookmarks'], async (result) => {
                if (result.bookmarks) {
                    cachedBookmarks = result.bookmarks;
                    sendResponse({ bookmarks: result.bookmarks });
                } else {
                    // 如果 storage 也没有，则重新获取
                    await updateBookmarkCache();
                    sendResponse({ bookmarks: cachedBookmarks });
                }
            });
        }
        return true; // 保持消息通道开放
    }
}); 
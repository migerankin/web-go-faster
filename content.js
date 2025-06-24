// 搜索字典
const searchDictionary = {
    'qq邮箱': 'https://mail.qq.com',
    'x': 'https://twitter.com/home',
    'bing': 'https://www.bing.com',
    'google': 'https://www.google.com',
    'google翻译': 'https://translate.google.com',
    '百度': 'https://www.baidu.com',
    '推特': 'https://twitter.com/home',
    'youtube': 'https://youtube.com',
    '油管': 'https://youtube.com',
    '抖音': 'https://www.douyin.com',
    'instagram': 'https://www.instagram.com',
    'twitter': 'https://twitter.com/home',
    'b站': 'https://www.bilibili.com',
    '哔哩哔哩': 'https://www.bilibili.com',
    '芒果tv': 'https://www.mgtv.com',
    '微博': 'https://www.weibo.com',
    'p站': 'https://www.pixiv.net',
    'pixiv': 'https://www.pixiv.net',
    'chatgpt': 'https://chatgpt.com',
    'deepseek': 'https://chat.deepseek.com',
    '贴吧': 'https://tieba.baidu.com',
    'telegram': 'https://web.telegram.org',
    '纸飞机': 'https://web.telegram.org',
    '网上共青团智慧团建': 'https://zhtj.youth.cn/zhtj',
    '维普论文查重': 'https://vpcs.fanyu.com/',
};

// 从书签栏导入书签
async function importBookmarks() {
    try {
        // 通过消息传递获取书签
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'getBookmarks' }, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        const bookmarks = response.bookmarks;

        // 递归处理书签树
        function processBookmarkTree(nodes) {
            for (const node of nodes) {
                if (node.url) {
                    // 使用书签标题作为键，URL作为值
                    const title = node.title.toLowerCase();
                    if (title && !searchDictionary[title]) {
                        searchDictionary[title] = node.url;
                    }
                }
                if (node.children) {
                    processBookmarkTree(node.children);
                }
            }
        }

        processBookmarkTree(bookmarks);
        console.log('书签导入完成');
    } catch (error) {
        console.error('导入书签失败:', error);
    }
}

// 创建搜索框和下拉列表
function createSearchBox() {
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
        position: fixed;
        left: 50%;
        top: 30%;
        transform: translate(-50%, -50%);
        width: 650px;
        z-index: 999999;
        display: none;
        box-sizing: border-box;
    `;

    const searchInput = document.createElement('input');
    searchInput.style.cssText = `
        width: 100%;
        height: 65px;
        background: #000;
        border: 1px solid #fff;
        color: #fff;
        font-size: 18px;
        padding: 0 20px;
        outline: none;
        box-sizing: border-box;
        font-family: system-ui, -apple-system, sans-serif;
        border-radius: 8px;
        transition: border-radius 0.2s;
    `;

    const dropdownList = document.createElement('div');
    dropdownList.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: #000;
        border: 1px solid #fff;
        border-top: none;
        max-height: 300px;
        overflow-y: auto;
        display: none;
        z-index: 1000000;
        box-sizing: border-box;
        margin-top: -1px;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        opacity: 0.92;
    `;

    // 添加滚动条样式
    const style = document.createElement('style');
    style.textContent = `
        .search-dropdown::-webkit-scrollbar {
            width: 8px;
        }
        .search-dropdown::-webkit-scrollbar-track {
            background: #000;
        }
        .search-dropdown::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 4px;
        }
        .search-dropdown::-webkit-scrollbar-thumb:hover {
            background: #444;
        }
    `;
    document.head.appendChild(style);
    dropdownList.classList.add('search-dropdown');

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(dropdownList);
    document.body.appendChild(searchContainer);

    return { searchContainer, searchInput, dropdownList };
}

// 初始化搜索功能
function initSearch() {
    const { searchContainer, searchInput, dropdownList } = createSearchBox();
    let selectedIndex = -1;

    // 更新输入框圆角
    function updateInputBorderRadius(hasResults) {
        if (hasResults) {
            searchInput.style.borderBottomLeftRadius = '0';
            searchInput.style.borderBottomRightRadius = '0';
        } else {
            searchInput.style.borderBottomLeftRadius = '8px';
            searchInput.style.borderBottomRightRadius = '8px';
        }
    }

    // 监听 Ctrl+Space
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            searchContainer.style.display = 'block';
            searchInput.focus();
        }
    });

    // 更新选中项
    function updateSelection(newIndex, items) {
        // 移除之前的选中状态
        if (selectedIndex >= 0 && items[selectedIndex]) {
            items[selectedIndex].style.background = '#000';
        }

        // 设置新的选中状态
        selectedIndex = newIndex;
        if (selectedIndex >= 0 && items[selectedIndex]) {
            items[selectedIndex].style.background = '#222';
            items[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    // 监听输入
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        if (!value) {
            dropdownList.style.display = 'none';
            selectedIndex = -1;
            updateInputBorderRadius(false);
            return;
        }

        // 模糊匹配
        const matches = Object.entries(searchDictionary).filter(([key, url]) => {
            return key.toLowerCase().includes(value);
        });

        // 显示匹配结果
        dropdownList.innerHTML = '';
        matches.forEach(([key, url], index) => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 12px 20px;
                color: #fff;
                cursor: pointer;
                border-bottom: 1px solid #333;
                font-size: 16px;
                font-family: system-ui, -apple-system, sans-serif;
                transition: background-color 0.2s;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            // 创建标题和URL容器
            const titleSpan = document.createElement('span');
            titleSpan.textContent = key;
            titleSpan.style.cssText = `
                flex: 2;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-right: 10px;
            `;

            const urlSpan = document.createElement('span');
            urlSpan.textContent = url;
            urlSpan.style.cssText = `
                flex: 1;
                color: #666;
                font-size: 12px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: right;
            `;

            // 添加鼠标悬停效果
            item.addEventListener('mouseenter', () => {
                if (selectedIndex !== index) {
                    updateSelection(index, dropdownList.children);
                }
            });

            item.appendChild(titleSpan);
            item.appendChild(urlSpan);

            item.addEventListener('click', () => {
                window.open(url, '_blank');
                searchContainer.style.display = 'none';
                searchInput.value = '';
                selectedIndex = -1;
                updateInputBorderRadius(false);
            });
            dropdownList.appendChild(item);
        });

        dropdownList.style.display = matches.length ? 'block' : 'none';
        updateInputBorderRadius(matches.length > 0);

        // 默认选中第一项
        if (matches.length > 0) {
            updateSelection(0, dropdownList.children);
        }
    });

    // 监听键盘事件
    searchInput.addEventListener('keydown', (e) => {
        const items = dropdownList.children;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (items.length > 0) {
                    updateSelection((selectedIndex + 1) % items.length, items);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (items.length > 0) {
                    updateSelection((selectedIndex - 1 + items.length) % items.length, items);
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    items[selectedIndex].click();
                }
                break;

            case 'Escape':
                searchContainer.style.display = 'none';
                searchInput.value = '';
                dropdownList.style.display = 'none';
                selectedIndex = -1;
                updateInputBorderRadius(false);
                break;
        }
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            searchContainer.style.display = 'none';
            searchInput.value = '';
            dropdownList.style.display = 'none';
            selectedIndex = -1;
            updateInputBorderRadius(false);
        }
    });
}

// 初始化
async function init() {
    // 导入书签
    await importBookmarks();
    initSearch();
}

init();
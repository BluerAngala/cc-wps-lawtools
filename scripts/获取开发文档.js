// 获取 WPS 开发文档链接的浏览器脚本
(function() {
    'use strict';
    
    console.log('🚀 开始获取 WPS 开发文档链接...');
    
    // 解码函数
    const decode = str => {
        try { return decodeURIComponent(str); } 
        catch (e) { return str; }
    };
    
    // 解析路径获取分类
    const getCategories = href => {
        try {
            let path = href;
            // 处理特殊格式
            if (href.includes('apiObjectTemplate.htm?page=')) {
                path = href.split('apiObjectTemplate.htm?page=')[1].split('#')[0];
            }
            
            const parts = decode(path).split('/').filter(Boolean);
            const topicsIndex = parts.indexOf('topics');
            
            if (topicsIndex >= 0 && topicsIndex + 1 < parts.length) {
                return parts.slice(topicsIndex + 1, topicsIndex + 4); // 最多3级
            }
            return ['其他'];
        } catch (e) {
            return ['其他'];
        }
    };
    
    // 收集所有链接
    const links = new Map(); // 使用Map去重
    
    document.querySelectorAll('div[navpath^="WPS"] a, div[navpath*="WPS"] a').forEach(a => {
        if (a.href && a.textContent.trim()) {
            const url = new URL(a.href, location.href).href;
            const text = a.textContent.trim();
            const categories = getCategories(a.href);
            
            // 去重：相同URL只保留一个
            if (!links.has(url)) {
                links.set(url, { text, url, categories });
            }
        }
    });
    
    console.log(`📊 找到 ${links.size} 个唯一链接`);
    
    // 构建分类树
    const tree = {};
    links.forEach(link => {
        let current = tree;
        link.categories.forEach((cat, i) => {
            if (i === link.categories.length - 1) {
                // 最后一级，存储链接
                if (!current[cat]) current[cat] = [];
                current[cat].push(link);
            } else {
                // 中间级别，创建子对象
                if (!current[cat]) current[cat] = {};
                current = current[cat];
            }
        });
    });
    
    // 生成Markdown
    const buildMd = (obj, level = 2) => {
        let md = '';
        Object.keys(obj).sort().forEach(key => {
            const value = obj[key];
            const heading = '#'.repeat(Math.min(level, 4)) + ' ' + decode(key) + '\n\n';
            
            if (Array.isArray(value)) {
                md += heading;
                value.forEach(link => {
                    md += `- [${link.text}](${link.url})\n`;
                });
                md += '\n';
            } else {
                md += heading + buildMd(value, level + 1);
            }
        });
        return md;
    };
    
    const markdown = '# WPS 开发文档链接\n\n' + buildMd(tree);
    
    // 输出和复制
    console.log('\n📋 Markdown结果：');
    console.log(markdown);
    
    // 简单复制
    try {
        navigator.clipboard?.writeText(markdown).then(() => 
            console.log('✅ 已复制到剪贴板')
        ).catch(() => {
            // 备用方案
            const textarea = document.createElement('textarea');
            textarea.value = markdown;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            console.log('✅ 已复制到剪贴板（备用）');
        });
    } catch (e) {
        console.warn('❌ 复制失败，请手动复制');
    }
    
    // 存储结果
    window.wpsDocLinks = { tree, markdown, links: Array.from(links.values()) };
    console.log(`\n💾 结果已保存到 window.wpsDocLinks (${links.size} 个链接)`);
    
    return window.wpsDocLinks;
})();
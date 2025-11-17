#!/usr/bin/env node

const { program } = require('commander');
const linkConverter = require('./lib/link-converter');

program
  .name('linkhub')
  .description('微信转链工具 CLI')
  .version('1.0.0');

program
  .command('add <name> <url>')
  .description('添加一个新的微信链接')
  .action(async (name, url) => {
    try {
      const newLink = await linkConverter.addLink(name, url);
      console.log(`链接添加成功！`);
      console.log(`名称: ${newLink.name}`);
      console.log(`ID: ${newLink.id}`);
      console.log(`二维码查看地址: /qr/${newLink.id}`);
      console.log(`跳转地址: /r/${newLink.id}`);
    } catch (error) {
      console.error('添加链接失败:', error.message);
    }
  });

program
  .command('list')
  .description('列出所有微信链接')
  .action(async () => {
    try {
      const links = await linkConverter.getAllLinks();
      if (links.length === 0) {
        console.log('暂无链接');
        return;
      }
      
      console.log('所有微信链接:');
      links.forEach(link => {
        console.log(`\n名称: ${link.name}`);
        console.log(`链接: ${link.url}`);
        console.log(`ID: ${link.id}`);
        console.log(`二维码查看地址: /qr/${link.id}`);
        console.log(`跳转地址: /r/${link.id}`);
      });
    } catch (error) {
      console.error('获取链接列表失败:', error.message);
    }
  });

program
  .command('qr <id>')
  .description('获取指定链接的二维码')
  .action(async (id) => {
    try {
      const link = await linkConverter.getLinkById(id);
      if (!link) {
        console.log('未找到指定ID的链接');
        return;
      }
      
      // For CLI, we'll just show the URL where the QR code can be viewed
      console.log(`请在浏览器中访问以下地址查看二维码:`);
      console.log(`/qr/${id}`);
    } catch (error) {
      console.error('获取二维码失败:', error.message);
    }
  });

program.parse();
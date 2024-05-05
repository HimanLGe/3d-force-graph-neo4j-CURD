const fs = require('fs');
const path = require('path');

class FileTreeBuilder {
    constructor(neo4jConnector) {
        // 导入数据库操作函数
        this.neo4jConnector = neo4jConnector;
    }

    async createFileTreeNodes(directoryPath, excludedFolders = [], rootNode = null) {
        // 初始化根节点
        if (!rootNode) {
            rootNode = this.neo4jConnector.initNode();
            rootNode.properties.name = path.basename(directoryPath);
            rootNode.id = (await this.neo4jConnector.addNodes([rootNode]))[0];
        }

        // 读取文件夹内容
        const files = fs.readdirSync(directoryPath);

        // 遍历文件夹内容
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const isDirectory = fs.statSync(filePath).isDirectory();

            if (isDirectory) {
                // 如果是文件夹，创建节点并添加到树中
                if (!excludedFolders.includes(file)) {
                    const folderNode = this.neo4jConnector.initNode();
                    folderNode.properties.name = file;
                    folderNode.id = (await this.neo4jConnector.addNodes([folderNode]))[0];

                    // 创建根文件夹到子文件夹的关系
                    const relationship = this.neo4jConnector.initRelationship();
                    relationship.properties.name = file;
                    relationship.labels = ["文件夹"];
                    relationship.id = (await this.neo4jConnector.addRelationships(rootNode.id, relationship, folderNode.id))[0];

                    // 递归处理子文件夹
                    await this.createFileTreeNodes(filePath, excludedFolders,folderNode);
                }
            } else {
                // 如果是文件，读取内容并创建节点
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const fileNode = this.neo4jConnector.initNode();
                fileNode.properties.name = fileContent;
                fileNode.id = (await this.neo4jConnector.addNodes([fileNode]))[0];

                // 创建根文件夹到文件的关系
                const relationship = this.neo4jConnector.initRelationship();
                relationship.properties.name = file;
                relationship.labels = ["文件"];
                relationship.id = (await this.neo4jConnector.addRelationships(rootNode.id, relationship, fileNode.id))[0];
            }
        }
    }
}

module.exports =  FileTreeBuilder;
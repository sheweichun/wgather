const template = require('template_js');
// const path = require('path');
const fs = require('fs');


const Template = {
  tpl(content, data) {
    try {
      return template(content, data);
    } catch (e) {
      return content;
    }
  },
  render(filePath, data) {
    if (!fs.existsSync(filePath)) {
      return '';
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const renderContent = Template.tpl(content, data);
    fs.writeFileSync(filePath, renderContent, 'urf-8');
    return renderContent;
  },
};

module.exports = Template;

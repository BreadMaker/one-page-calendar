/*global moment, bootstrap*/

// Custom $(document).ready() function
function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// Takes the list of days and reoders it depending of the locale's first day
function sortWeekDays(arr, firstDay) {
  let result = {};
  if (firstDay === 0) {
    result = arr.splice(1);
    return result.concat(arr);
  } else if (firstDay === 6) {
    result = arr.splice(2);
    return result.concat(arr);
  } else {
    return arr;
  }
}

// Populates the calendar with the proper days/months order
function populateCalendar() {
  let weekDaysNames = sortWeekDays(moment.weekdaysShort(true), moment.localeData().firstDayOfWeek()),
    monthsNames = moment.monthsShort(),
    now = moment(),
    eod = moment().endOf('day'),
    year = now.year(),
    tempMoment = moment(now),
    count = 0;
  document.querySelectorAll('.days').forEach(element => {
    element.querySelectorAll('.day').forEach(dayElement => {
      dayElement.dataset.day = count;
      count++;
      if (count > 6) {
        count = 0;
      }
    });
    count++;
  });
  let monthsElements = document.querySelectorAll('.months>.month');
  monthsElements.forEach(element => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
  for (var i = 0; i < 12; i++) {
    tempMoment.set({
      'year': year,
      'date': 1,
      'month': i
    });
    let month = document.querySelector('.months > .month:nth-child(' +
      (tempMoment.isoWeekday() + 1) + '):empty');
    month.dataset.month = i;
    month.textContent = monthsNames[i];
    let monthContent = document.createElement('span');
    monthContent.classList.add('badge', 'bg-secondary', 'position-absolute');
    monthContent.appendChild(document.createTextNode(tempMoment.daysInMonth()));
    month.appendChild(monthContent);
    document.querySelectorAll('.days > .day:nth-child(' + (tempMoment.isoWeekday() + 5) + ')').forEach(element => {
      let dayData = element.dataset;
      if (dayData.months === undefined) {
        dayData.months = JSON.stringify([i]);
      } else {
        dayData.months = JSON.stringify(JSON.parse(dayData.months).concat([i]));
      }
    });
  }
  document.getElementById('date').textContent = now.format('LL');
  document.getElementById('year').textContent = year;
  document.getElementById('copyleft-year').textContent = year;
  document.querySelectorAll('.day').forEach(element => {
    element.textContent = weekDaysNames[element.dataset.day];
    element.classList.toggle('table-danger', element.dataset.day == 6);
  });
  document.querySelectorAll('.month').forEach(element => {
    if (element.dataset.month == now.toObject().months)
      element.classList.add('table-active');
  });
  let dateCell = document.evaluate("//td[text()='" + now.toObject().date + "']",
    document, null, XPathResult.ANY_TYPE, null).iterateNext();
  dateCell.classList.add('table-active');
  dateCell.parentNode.querySelectorAll('.day').forEach(element => {
    if (element.dataset.months !== undefined && JSON.parse(element.dataset.months).includes(now.toObject().months))
      element.classList.add('table-active');
  });
  // Setting a timeout to autoupdate calendar 100ms past midnight
  setTimeout(populateCalendar, eod.diff(now) + 100);
}

let verticalPhoneModal;

// Displays a modal suggesting the use of vertical mode on mobile devices
function checkTightSpot() {
  if (window.innerWidth < 468) {
    if (localStorage.getItem('dont-bother-vertical') == null || localStorage.getItem('dont-bother-vertical') == 'false') {
      verticalPhoneModal.show();
    }
  } else if (window.innerWidth < 564) {
    document.getElementById('one-page-calendar').classList.add('table-sm');
  } else {
    let hideModalHandler = () => {
      verticalPhoneModal.hide();
    };
    document.getElementById('vertical-mobile-modal').addEventListener('hidden.bs.modal', hideModalHandler, {
      once: true
    });
    document.getElementById('one-page-calendar').classList.remove('table-sm');
    hideModalHandler();
    document.getElementById('vertical-mobile-modal').removeEventListener('hidden.bs.modal', hideModalHandler);
  }
}

// Find all elements that have any class ending in "-light" or "-dark"
function toggleLightDarkClasses() {
  document.body.querySelectorAll('[class*="-light"], [class*="-dark"]').forEach(el => {
    // get the full className string
    let cls = el.className;
    // regex to replace all "-light" suffixes with "-dark", and "-dark" with "-light"
    cls = cls.replace(/\b([^\s]+?)-(light|dark)\b/g, (match, base, suffix) => {
      return base + (suffix === 'light' ? '-dark' : '-light');
    });
    el.className = cls;
  });
}



// Drawing functionality
class DrawingManager {
  constructor() {
    this.canvas = document.getElementById('drawing-canvas');
    if (!this.canvas) {
      console.error('Drawing canvas not found in DOM');
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.container = document.getElementById('one-page-calendar-container');
    if (!this.container) {
      console.error('Calendar container not found');
      return;
    }
    
    this.isDrawing = false;
    this.currentTool = 'pen';
    this.penSize = 2;
    this.currentColor = '#000000';
    
    this.strokes = [];
    this.currentStroke = null;
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    
    this.isToolbarExpanded = false;
    this.isDarkMode = this.checkDarkMode();
    
    this.init();
  }
  
  checkDarkMode() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark' || 
           localStorage.getItem('dark-mode') === 'dark';
  }
  
  adjustColorForDarkMode(color) {
    if (!this.isDarkMode) return color;
    
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    r = Math.min(255, r + 80);
    g = Math.min(255, g + 80);
    b = Math.min(255, b + 80);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.loadStrokes();
    this.updateUndoRedoButtons();
    
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.redrawAll();
    });
    
    this.observeThemeChanges();
  }
  
  observeThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-bs-theme') {
          this.isDarkMode = this.checkDarkMode();
          this.redrawAll();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
  }
  
  setupCanvas() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }
  
  setupEventListeners() {
    const toolbarToggle = document.getElementById('toolbar-toggle');
    const toolbarContent = document.getElementById('toolbar-content');
    
    toolbarToggle.addEventListener('click', () => {
      this.isToolbarExpanded = !this.isToolbarExpanded;
      toolbarContent.classList.toggle('d-none', !this.isToolbarExpanded);
      toolbarContent.classList.toggle('collapsed', !this.isToolbarExpanded);
    });
    
    document.getElementById('pen-tool').addEventListener('click', (e) => {
      this.setTool('pen', e.target.closest('button'));
    });
    
    document.getElementById('highlighter-tool').addEventListener('click', (e) => {
      this.setTool('highlighter', e.target.closest('button'));
    });
    
    document.getElementById('eraser-tool').addEventListener('click', (e) => {
      this.setTool('eraser', e.target.closest('button'));
    });
    
    document.querySelectorAll('#pen-size-group button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.penSize = parseInt(e.target.closest('button').dataset.size);
        document.querySelectorAll('#pen-size-group button').forEach(b => b.classList.remove('active'));
        e.target.closest('button').classList.add('active');
      });
    });
    
    document.querySelectorAll('[data-color]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentColor = e.target.closest('button').dataset.color;
        document.querySelectorAll('[data-color]').forEach(b => b.classList.remove('active'));
        e.target.closest('button').classList.add('active');
      });
    });
    
    document.getElementById('undo-button').addEventListener('click', () => {
      this.undo();
    });
    
    document.getElementById('redo-button').addEventListener('click', () => {
      this.redo();
    });
    
    document.getElementById('export-png-button').addEventListener('click', () => {
      this.exportAsPNG();
    });
    
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', (e) => this.stopDrawing(e));
    this.canvas.addEventListener('mouseleave', (e) => this.stopDrawing(e));
    
    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.draw(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.stopDrawing(e));
    this.canvas.addEventListener('touchcancel', (e) => this.stopDrawing(e));
  }
  
  setTool(tool, buttonElement) {
    this.currentTool = tool;
    
    document.querySelectorAll('#drawing-toolbar .btn-group:first-child button').forEach(btn => {
      btn.classList.remove('active');
    });
    buttonElement.classList.add('active');
    
    this.canvas.classList.toggle('drawing-active', tool !== 'eraser' || this.strokes.length > 0);
  }
  
  getEventPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
  
  startDrawing(e) {
    if (this.currentTool === 'eraser') {
      this.eraseStroke(e);
      return;
    }
    
    e.preventDefault();
    this.isDrawing = true;
    
    const pos = this.getEventPos(e);
    let color = this.currentColor;
    
    if (this.currentTool === 'highlighter') {
      color = this.adjustColorForDarkMode(this.currentColor);
    }
    
    this.currentStroke = {
      tool: this.currentTool,
      color: color,
      size: this.penSize * (this.currentTool === 'highlighter' ? 3 : 1),
      points: [pos],
      opacity: this.currentTool === 'highlighter' ? 0.4 : 1
    };
  }
  
  draw(e) {
    if (!this.isDrawing || !this.currentStroke) return;
    
    e.preventDefault();
    const pos = this.getEventPos(e);
    this.currentStroke.points.push(pos);
    this.drawStroke(this.currentStroke);
  }
  
  stopDrawing(e) {
    if (!this.isDrawing || !this.currentStroke) return;
    
    this.isDrawing = false;
    
    if (this.currentStroke.points.length > 1) {
      this.strokes.push({ ...this.currentStroke });
      this.addToHistory({ action: 'add', stroke: this.currentStroke });
      this.saveStrokes();
    }
    
    this.currentStroke = null;
    this.redrawAll();
  }
  
  drawStroke(stroke) {
    if (stroke.points.length < 2) return;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.size;
    this.ctx.globalAlpha = stroke.opacity;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      this.ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }
  
  redrawAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.strokes.forEach(stroke => {
      const adjustedStroke = { ...stroke };
      if (stroke.tool === 'highlighter') {
        adjustedStroke.color = this.adjustColorForDarkMode(stroke.color);
      }
      this.drawStroke(adjustedStroke);
    });
  }
  
  eraseStroke(e) {
    const pos = this.getEventPos(e);
    const tolerance = this.penSize * 2;
    
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const stroke = this.strokes[i];
      
      for (const point of stroke.points) {
        const distance = Math.sqrt(
          Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
        );
        
        if (distance <= tolerance + stroke.size / 2) {
          const removedStroke = this.strokes.splice(i, 1)[0];
          this.addToHistory({ action: 'remove', stroke: removedStroke, index: i });
          this.saveStrokes();
          this.redrawAll();
          return;
        }
      }
    }
  }
  
  addToHistory(action) {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push(action);
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
    
    this.updateUndoRedoButtons();
  }
  
  undo() {
    if (this.historyIndex < 0) return;
    
    const action = this.history[this.historyIndex];
    
    if (action.action === 'add') {
      this.strokes.pop();
    } else if (action.action === 'remove') {
      this.strokes.splice(action.index, 0, action.stroke);
    }
    
    this.historyIndex--;
    this.saveStrokes();
    this.redrawAll();
    this.updateUndoRedoButtons();
  }
  
  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    
    this.historyIndex++;
    const action = this.history[this.historyIndex];
    
    if (action.action === 'add') {
      this.strokes.push(action.stroke);
    } else if (action.action === 'remove') {
      this.strokes.splice(action.index, 1);
    }
    
    this.saveStrokes();
    this.redrawAll();
    this.updateUndoRedoButtons();
  }
  
  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-button');
    const redoBtn = document.getElementById('redo-button');
    
    undoBtn.disabled = this.historyIndex < 0;
    redoBtn.disabled = this.historyIndex >= this.history.length - 1;
  }
  
  saveStrokes() {
    localStorage.setItem('calendar-strokes', JSON.stringify(this.strokes));
  }
  
  loadStrokes() {
    const saved = localStorage.getItem('calendar-strokes');
    if (saved) {
      try {
        this.strokes = JSON.parse(saved);
        this.redrawAll();
      } catch (e) {
        console.error('Failed to load strokes:', e);
        this.strokes = [];
      }
    }
  }
  
  async exportAsPNG() {
    const toolbar = document.getElementById('drawing-toolbar');
    const topButtons = document.getElementById('top-buttons');
    const bottomCredits = document.getElementById('bottom-credits');
    
    toolbar.style.display = 'none';
    topButtons.style.display = 'none';
    bottomCredits.style.display = 'none';
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const table = document.getElementById('one-page-calendar');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const scale = 2;
      const rect = this.container.getBoundingClientRect();
      
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      
      ctx.scale(scale, scale);
      
      ctx.fillStyle = this.isDarkMode ? '#212529' : '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      const tableHtml = table.outerHTML;
      const styles = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            return '';
          }
        })
        .join('\n');
      
      const data = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;">
              <style>${styles}</style>
              ${tableHtml}
            </div>
          </foreignObject>
        </svg>
      `;
      
      const img = new Image();
      const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
        ctx.drawImage(this.canvas, 0, 0);
        
        const link = document.createElement('a');
        link.download = `calendar-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        URL.revokeObjectURL(url);
        
        toolbar.style.display = '';
        topButtons.style.display = '';
        bottomCredits.style.display = '';
      };
      
      img.onerror = () => {
        this.exportAsSimplePNG(ctx, rect, scale);
        
        toolbar.style.display = '';
        topButtons.style.display = '';
        bottomCredits.style.display = '';
      };
      
      img.src = url;
      
    } catch (e) {
      console.error('Export failed:', e);
      
      toolbar.style.display = '';
      topButtons.style.display = '';
      bottomCredits.style.display = '';
      
      alert('Export failed. Please try again.');
    }
  }
  
  exportAsSimplePNG(ctx, rect, scale) {
    ctx.fillStyle = this.isDarkMode ? '#212529' : '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    ctx.font = '16px sans-serif';
    ctx.fillStyle = this.isDarkMode ? '#ffffff' : '#000000';
    ctx.fillText('Calendar (drawing only)', 10, 30);
    
    ctx.drawImage(this.canvas, 0, 0);
    
    const link = document.createElement('a');
    link.download = `calendar-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = ctx.canvas.toDataURL('image/png');
    link.click();
  }
}

ready(() => {
  // Dark Mode
  if (localStorage.getItem('dark-mode') === null)
    localStorage.setItem('dark-mode', 'dark');
  else if (localStorage.getItem('dark-mode') === 'light') {
    document.querySelectorAll('[data-bs-theme-value]').forEach(el => el.classList.toggle('d-none'));
    document.documentElement.setAttribute('data-bs-theme', 'light');
    toggleLightDarkClasses();
  }
  document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
    element.addEventListener('click', () => {
      document.documentElement.setAttribute('data-bs-theme', element.getAttribute('data-bs-theme-value'));
      localStorage.setItem('dark-mode', element.getAttribute('data-bs-theme-value'));
      document.querySelectorAll('[data-bs-theme-value]').forEach(el => el.classList.toggle('d-none'));
      toggleLightDarkClasses();
    });
  });
  // Print functionality
  let printModal = new bootstrap.Modal(document.getElementById('print-modal'));
  document.getElementById('launch-print-modal-button').addEventListener('click', () => {
    printModal.show();
  });
  document.getElementById('print-calendar-button').addEventListener('click', () => {
    document.getElementById('print-modal').addEventListener('hidden.bs.modal', () => {
      window.print();
    }, {
      once: true
    });
  });
  // Vertical phone mode warning
  document.getElementById('dont-bother-checkbox').checked = false;
  verticalPhoneModal = new bootstrap.Modal(document.getElementById('vertical-mobile-modal'));
  checkTightSpot();
  window.addEventListener('resize', checkTightSpot);
  document.getElementById('dont-bother-checkbox').addEventListener('change', (event) => {
    localStorage.setItem('dont-bother-vertical', event.target.checked);
  });
  // Main functionality
  moment.locale(window.navigator.language);
  populateCalendar();
  // Tooltips
  [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: 'd-print-none',
      trigger: 'hover'
    });
  });
  // Initialize drawing functionality
  function initDrawing() {
    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
      new DrawingManager();
    } else {
      console.error('Drawing canvas not found, retrying...');
      setTimeout(initDrawing, 100);
    }
  }
  
  if (document.readyState === 'complete') {
    initDrawing();
  } else {
    window.addEventListener('load', initDrawing);
  }
});

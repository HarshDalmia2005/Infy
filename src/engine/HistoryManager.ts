import { CanvasElement } from './types';
import { useBoardStore } from '../stores/boardStore';

export interface Command {
  execute(): void;
  undo(): void;
}

export class AddElementCommand implements Command {
  constructor(private element: CanvasElement) {}
  
  execute() {
    useBoardStore.getState().addElement(this.element);
  }
  
  undo() {
    useBoardStore.getState().removeElement(this.element.id);
  }
}

export class RemoveElementCommand implements Command {
  constructor(private element: CanvasElement) {}
  
  execute() {
    useBoardStore.getState().removeElement(this.element.id);
  }
  
  undo() {
    useBoardStore.getState().addElement(this.element);
  }
}

class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory = 50;

  execute(command: Command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }
  
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const historyManager = new HistoryManager();

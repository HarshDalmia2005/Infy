import { CanvasElement } from './types';
import { useBoardStore } from '../stores/boardStore';
import { getSocket } from '../lib/socket';
import { SOCKET_EVENTS } from '../socket/events';

export interface Command {
  execute(emit?: boolean): void;
  undo(emit?: boolean): void;
}

export class AddElementCommand implements Command {
  constructor(private element: CanvasElement) {}
  
  execute(emit = true) {
    useBoardStore.getState().addElement(this.element);
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_ADD, this.element);
  }
  
  undo(emit = true) {
    useBoardStore.getState().removeElement(this.element.id);
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_REMOVE, this.element.id);
  }
}

export class RemoveElementCommand implements Command {
  constructor(private element: CanvasElement) {}
  
  execute(emit = true) {
    useBoardStore.getState().removeElement(this.element.id);
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_REMOVE, this.element.id);
  }
  
  undo(emit = true) {
    useBoardStore.getState().addElement(this.element);
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_ADD, this.element);
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

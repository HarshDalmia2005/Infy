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

export class MoveElementCommand implements Command {
  constructor(
    private elementBefore: CanvasElement,
    private elementAfter: CanvasElement,
  ) {}

  execute(emit = true) {
    useBoardStore.getState().updateElement(this.elementAfter.id, { points: this.elementAfter.points });
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_UPDATE, this.elementAfter);
  }

  undo(emit = true) {
    useBoardStore.getState().updateElement(this.elementBefore.id, { points: this.elementBefore.points });
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_UPDATE, this.elementBefore);
  }
}

export class UpdateTextCommand implements Command {
  private elementBefore: CanvasElement;
  private elementAfter: CanvasElement;

  constructor(element: CanvasElement, newText: string) {
    this.elementBefore = element;
    this.elementAfter = { ...element, text: newText };
  }

  execute(emit = true) {
    useBoardStore.getState().updateElement(this.elementAfter.id, this.elementAfter);
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_UPDATE, this.elementAfter);
  }

  undo(emit = true) {
    useBoardStore.getState().updateElement(this.elementBefore.id, this.elementBefore);
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_UPDATE, this.elementBefore);
  }
}

export class ResizeElementCommand implements Command {
  constructor(
    private elementBefore: CanvasElement,
    private elementAfter: CanvasElement,
  ) {}

  execute(emit = true) {
    useBoardStore.getState().updateElement(this.elementAfter.id, this.elementAfter);
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_UPDATE, this.elementAfter);
  }

  undo(emit = true) {
    useBoardStore.getState().updateElement(this.elementBefore.id, this.elementBefore);
    if (emit) getSocket().emit(SOCKET_EVENTS.ELEMENT_UPDATE, this.elementBefore);
  }
}

export class ClearAllCommand implements Command {
  constructor(private snapshot: CanvasElement[]) {}

  execute(emit = true) {
    useBoardStore.getState().clearAll();
    if (emit) getSocket().emit('clear-all');
  }

  undo() {
    for (const el of this.snapshot) {
      useBoardStore.getState().addElement(el);
    }
  }
}

class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory = 50;

  execute(command: Command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
    this.redoStack = [];
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

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const historyManager = new HistoryManager();

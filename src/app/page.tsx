import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import LandingClient from './LandingClient';

export default function Home() {
  async function createBoard() {
    'use server';
    redirect(`/board/${uuidv4()}`);
  }

  async function joinBoard(formData: FormData) {
    'use server';
    let id = String(formData.get('boardId') ?? '').trim();
    if (id) {
      if (id.includes('/board/')) {
        id = id.split('/board/').pop() || id;
      }
      redirect(`/board/${id}`);
    }
  }

  return <LandingClient createBoard={createBoard} joinBoard={joinBoard} />;
}

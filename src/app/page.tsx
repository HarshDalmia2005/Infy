import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import LandingClient from './LandingClient';
import { auth } from '../lib/auth';
import { prisma } from '../lib/prisma';

export default async function Home() {
  const session = await auth();
  
  let boards: { id: string; name: string; updatedAt: Date }[] = [];
  if (session?.user?.id) {
    boards = await prisma.board.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, updatedAt: true }
    });
  }

  async function createBoard() {
    'use server';
    const id = uuidv4();
    
    // If logged in, create a record in DB immediately
    const session = await auth();
    if (session?.user?.id) {
      await prisma.board.create({
        data: {
          id,
          name: 'Untitled Board',
          data: JSON.stringify([]),
          ownerId: session.user.id
        }
      });
    }

    redirect(`/board/${id}`);
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

  return <LandingClient createBoard={createBoard} joinBoard={joinBoard} initialBoards={boards} session={session} />;
}

import { Request, Response } from 'express';
import prisma from '../prisma';

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      where: { companyId: (req as any).company.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, email, matriculeFiscal, address, phone } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const client = await prisma.client.create({
      data: {
        companyId: (req as any).company.id,
        name,
        email,
        matriculeFiscal,
        address,
        phone
      }
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const updatedClient = await prisma.client.update({
      where: { id: req.params.id as string },
      data: req.body
    });

    res.status(200).json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await prisma.client.delete({
      where: { id: req.params.id as string }
    });

    res.status(200).json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

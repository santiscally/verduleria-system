import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { IApiResponse, ILoginRequest, ILoginResponse } from '../types';

export class AuthController {
  private authService = new AuthService();

  login = async (req: Request, res: Response) => {
    try {
      const credentials: ILoginRequest = req.body;
      const result = await this.authService.login(credentials);

      const response: IApiResponse<ILoginResponse> = {
        success: true,
        data: result
      };

      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al iniciar sesión'
      };
      res.status(401).json(response);
    }
  };

  me = async (req: AuthRequest, res: Response) => {
    const response: IApiResponse<{ id: number; username: string }> = {
      success: true,
      data: req.user!
    };
    res.json(response);
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      await this.authService.changePassword(req.user!.id, oldPassword, newPassword);

      const response: IApiResponse<null> = {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al cambiar contraseña'
      };
      res.status(400).json(response);
    }
  };
}
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const Schema = z.object({ email: z.string().email(), password: z.string().min(6) });

type FormData = z.infer<typeof Schema>;

export default function Login() {
  const { save } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = async (data: FormData) => {
    const r = await api.post('/auth/login', data);
    save(r.data.token);
    window.location.href = '/admin';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto mt-10 max-w-sm space-y-3">
      <h1 className="text-xl font-semibold">Entrar</h1>
      <input className="w-full rounded-lg border px-3 py-2" placeholder="E-mail" {...register('email')} />
      {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
      <input type="password" className="w-full rounded-lg border px-3 py-2" placeholder="Senha" {...register('password')} />
      {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
      <button disabled={isSubmitting} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white">Entrar</button>
    </form>
  );
}

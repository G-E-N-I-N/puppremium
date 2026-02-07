'use client'

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Upload, X, Check, Edit3, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDogs, useCreateDog, useUpdateDog, useDeleteDog, Dog, DogInsert } from '@/hooks/useDogs';
import { createClient } from '@/lib/supabase/client';

const initialFormData: DogInsert = {
    name: '',
    breed: '',
    age_months: 3,
    price: 1000,
    description_en: '',
    description_fr: '',
    gender: 'male',
    size: 'medium',
    status: 'available',
    image_url: '',
    is_featured: false,
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

const Admin = () => {
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const { data: dogs, isLoading } = useDogs();
    const createDog = useCreateDog();
    const updateDog = useUpdateDog();
    const deleteDog = useDeleteDog();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingDog, setEditingDog] = useState<Dog | null>(null);
    const [formData, setFormData] = useState<DogInsert>(initialFormData);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        if(status === 'unauthenticated') {
            router.replace('/login');
            return;
        }

        if(status === 'authenticated' && session?.user.role !== 'admin') {
            router.replace('/');
        }
    }, [status, session, router]);

    const handleOpenDialog = (dog?: Dog) => {
        setImageFile(null);
        setImagePreview(dog?.image_url || null);
        setImageError(null);
        if (dog) {
            setEditingDog(dog);
            setFormData({
                name: dog.name,
                breed: dog.breed,
                age_months: dog.age_months,
                price: dog.price,
                description_en: dog.description_en || '',
                description_fr: dog.description_fr || '',
                gender: dog.gender,
                size: dog.size,
                status: dog.status,
                image_url: dog.image_url || '',
                is_featured: dog.is_featured || false,
            });
        } else {
            setEditingDog(null);
            setFormData(initialFormData);
        }
        setIsDialogOpen(true);
    };

    const handleImage = (file: File) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            setImageError(t('admin.imageErrorType'));
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setImageError(t('admin.imageErrorSize'));
            return;
        }

        setImageError(null);
        setImageFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImage(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageError(null);
        setFormData({ ...formData, image_url: '' })
    };

    const supabase = createClient();
    const handleSendImage = async () => {
        if (!imageFile) return;

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = fileName;
        setLoading(true);

        try {
            const { error: uploadError } = await supabase.storage
                .from('Royal-Teckel-Homes')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                console.error(uploadError.message);
                return;
            }

            const { data } = supabase.storage
                .from('Royal-Teckel-Homes')
                .getPublicUrl(filePath);

            if (data?.publicUrl) {
                setFormData((prev) => ({
                    ...prev,
                    image_url: data.publicUrl,
                }));
            }
        } catch (err: any) {
            console.error(err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDog) {
            await updateDog.mutateAsync({ _id: editingDog._id, ...formData });
        } else {
            await createDog.mutateAsync(formData);
        }
        setIsDialogOpen(false);
        setEditingDog(null);
        setFormData(initialFormData);
    };

    const handleDelete = async (id: string) => {
        await deleteDog.mutateAsync(id);
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    if (!session || session.user.role !== 'admin') {
        return null;
    }

    return (
        <div className="py-12 md:py-16">
            <div
                className="fixed right-8 bottom-4 text-sm md:text-xl z-99 text-white/8 font-[Great_Vibes] select-none"
                style={{
                    transform: 'rotate(-5deg)',
                    whiteSpace: 'nowrap',
                }}
            >
                l0rd_9h057
            </div>

            <div className="container mx-auto mt-15 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="font-display text-3xl md:text-4xl font-bold">
                            {t('admin.title')}
                        </h1>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => handleOpenDialog()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('admin.addDog')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="font-display">
                                        {editingDog ? t('admin.editDog') : t('admin.addDog')}
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">{t('admin.name')}</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="breed">{t('admin.breed')}</Label>
                                            <Input
                                                id="breed"
                                                value={formData.breed}
                                                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="age">{t('admin.age')}</Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                min="1"
                                                value={formData.age_months}
                                                onChange={(e) => setFormData({ ...formData, age_months: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="price">{t('admin.price')}</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('admin.gender')}</Label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) =>
                                                    setFormData({
                                                    ...formData,
                                                    gender: e.target.value as 'male' | 'female',
                                                    })
                                                }
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                <option value="male">{t('dogs.male')}</option>
                                                <option value="female">{t('dogs.female')}</option>
                                                </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('admin.size')}</Label>
                                            <select
                                                value={formData.size}
                                                onChange={(e) =>
                                                    setFormData({
                                                    ...formData,
                                                    size: e.target.value as 'small' | 'medium' | 'large',
                                                    })
                                                }
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                <option value="small">{t('dogs.small')}</option>
                                                <option value="medium">{t('dogs.medium')}</option>
                                                <option value="large">{t('dogs.large')}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('admin.status')}</Label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) =>
                                                    setFormData({
                                                    ...formData,
                                                    status: e.target.value as 'available' | 'reserved' | 'sold',
                                                    })
                                                }
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                <option value="available">{t('dogs.available')}</option>
                                                <option value="reserved">{t('dogs.reserved')}</option>
                                                <option value="sold">{t('dogs.sold')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="imageUrl">{t('admin.imageUrl')}</Label>
                                        <Input
                                            id="imageUrl"
                                            type="url"
                                            value={formData.image_url || ''}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            placeholder="https://..."
                                            disabled={!!imagePreview}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('admin.image')}</Label>

                                        {!(imagePreview || formData.image_url) ? (
                                            <div
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={handleDrop}
                                                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-6 text-sm text-muted-foreground cursor-pointer hover:border-primary transition"
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg"
                                                    hidden
                                                    id="imageUpload"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            handleImage(e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                                <Label
                                                    htmlFor="imageUpload"
                                                    className="cursor-pointer text-center"
                                                >
                                                    <p className="font-medium">{t('admin.dropImage')}</p>
                                                    <p className="text-xs opacity-70">
                                                        JPG / PNG — max 2Mo
                                                    </p>
                                                </Label>
                                            </div>
                                        ) : (
                                            <div className="relative rounded-lg border overflow-hidden">
                                                <img
                                                    src={imagePreview || formData.image_url!}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />

                                                <div className="absolute inset-0 bg-black/40 opacity-100 hover:opacity-100 transition flex items-center justify-center gap-3">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={handleRemoveImage}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />{t('admin.remove')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => document.getElementById('imageUpload')?.click()}
                                                    >
                                                        <Edit3 className="w-4 h-4 mr-2" />{t('admin.change')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleSendImage() }
                                                    >
                                                        {loading ? (
                                                            <Loader className='w-4 h-4 mr-2 animate-spin' />
                                                        ) : (
                                                            <><Check className="w-4 h-4 mr-2" />{t('admin.send')}</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {imageError && (
                                            <p className="text-sm text-destructive">
                                                {imageError}
                                            </p>
                                        )}
                                    </div>


                                    <div className="space-y-2">
                                        <Label htmlFor="descEn">{t('admin.description')} (EN)</Label>
                                        <Textarea
                                            id="descEn"
                                            value={formData.description_en || ''}
                                            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="descFr">{t('admin.description')} (FR)</Label>
                                        <Textarea
                                            id="descFr"
                                            value={formData.description_fr || ''}
                                            onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="featured"
                                            checked={formData.is_featured || false}
                                            onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_featured: checked })}
                                        />
                                        <Label htmlFor="featured">{t('admin.featured')}</Label>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            {t('admin.cancel')}
                                        </Button>
                                        <Button type="submit" disabled={createDog.isPending || updateDog.isPending}>
                                            {loading ? (
                                                <Loader className='w-4 h-4 mr-2 animate-spin' />
                                            ) : editingDog ? (
                                                <><Check className="w-4 h-4 mr-2" />{t('admin.save')}</>
                                            ) : (
                                                <><Plus className="w-4 h-4 mr-2" />{t('admin.addDog')}</>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                        </DialogContent>
                        </Dialog>
                    </div>
                </motion.div>

                {/* Dogs Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-lg border shadow-card overflow-hidden"
                >
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            {t('common.loading')}
                        </div>
                    ) : dogs && dogs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('admin.name')}</TableHead>
                                        <TableHead>{t('admin.breed')}</TableHead>
                                        <TableHead>{t('admin.age')}</TableHead>
                                        <TableHead>{t('admin.price')}</TableHead>
                                        <TableHead>{t('admin.status')}</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dogs.map((dog) => (
                                        <TableRow key={dog._id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    {dog.image_url && (
                                                        <img
                                                        src={dog.image_url}
                                                        alt={dog.name}
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                        />
                                                    )}
                                                    <span>{dog.name}</span>
                                                    {dog.is_featured && <span className="text-gold">★</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{dog.breed}</TableCell>
                                            <TableCell>{dog.age_months} {t('dogs.months')}</TableCell>
                                            <TableCell>€{dog.price}</TableCell>
                                            <TableCell>{t(`dogs.${dog.status}`)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(dog)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('admin.deleteDog')}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('admin.confirmDelete')}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(dog._id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {t('admin.deleteDog')}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            {t('dogs.noResults')}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Admin;
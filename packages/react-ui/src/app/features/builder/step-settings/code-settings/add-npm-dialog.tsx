import { typeboxResolver } from '@hookform/resolvers/typebox';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  toast,
} from '@openops/components/ui';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { api } from '@/app/lib/api';

const formSchema = Type.Object({
  packageName: Type.String({
    minLength: 1,
    errorMessage: t('The package name is required'),
  }),
});

type AddNpmDialogProps = {
  children: React.ReactNode;
  onAdd: (packageName: string, packageVersion: string) => void;
};
const AddNpmDialog = ({ children, onAdd }: AddNpmDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<Static<typeof formSchema>>({
    defaultValues: {},
    resolver: typeboxResolver(formSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { packageName } = form.getValues();
      const response = await api.get<{ 'dist-tags': { latest: string } }>(
        `https://registry.npmjs.org/${packageName}`,
      );
      return {
        packageName,
        version: response['dist-tags'].latest,
      };
    },
    onSuccess: ({ packageName, version }) => {
      onAdd(packageName, version);
      setOpen(false);
      toast({
        title: t('Success'),
        description: t('Package added successfully'),
        duration: 3000,
      });
    },
    onError: () => {
      form.setError('root.serverError', {
        message: t('Could not fetch package version'),
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Add NPM Package')}</DialogTitle>
          <DialogDescription>
            {t('Type the name of the npm package you want to add.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="packageName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="packageName">{t('Package Name')}</Label>
                  <Input
                    {...field}
                    id="packageName"
                    type="text"
                    placeholder="hello-world"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormDescription>
              {t('The latest version will be fetched and added')}
            </FormDescription>
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t('Close')}
            </Button>
          </DialogClose>
          <Button type="submit" loading={isPending} onClick={() => mutate()}>
            {t('Add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddNpmDialog.displayName = 'AddNpmDialog';
export { AddNpmDialog };

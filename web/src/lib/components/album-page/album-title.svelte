<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAlbumInfo } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { tv } from 'tailwind-variants';

  interface Props {
    id: string;
    albumName: string;
    isOwned: boolean;
    onUpdate: (albumName: string) => void;
  }

  let { id, albumName = $bindable(), isOwned, onUpdate }: Props = $props();

  let newAlbumName = $derived(albumName);
  let inputEl: HTMLInputElement;
  let sizeIndex = $state(0);

  const sizeClasses = [
    'text-2xl md:text-4xl lg:text-6xl',
    'text-xl md:text-2xl lg:text-4xl',
    'text-lg md:text-xl lg:text-2xl',
    'text-base md:text-lg lg:text-xl',
  ];

  const handleUpdateName = async () => {
    if (newAlbumName === albumName) {
      return;
    }

    try {
      const response = await updateAlbumInfo({
        id,
        updateAlbumDto: {
          albumName: newAlbumName,
        },
      });
      ({ albumName } = response);
      eventManager.emit('AlbumUpdate', response);
      onUpdate(albumName);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
      return;
    }
  };

  const styles = tv({
    base: 'w-[99%] mb-2 border-b-2 border-transparent text-primary outline-none transition-all focus:border-b-2 focus:border-immich-primary focus:outline-none bg-light dark:focus:border-immich-dark-primary dark:focus:bg-immich-dark-gray placeholder:text-primary/90',
    variants: {
      isOwned: {
        true: 'hover:border-gray-400',
        false: 'hover:border-transparent',
      },
    },
  });

  const updateTextSize = () => {
    if (!inputEl) {
      return;
    }

    const availableWidth = inputEl.clientWidth;
    const style = getComputedStyle(inputEl);
    const span = document.createElement('span');

    span.textContent = inputEl.value || inputEl.placeholder;
    span.style.fontFamily = style.fontFamily;
    span.style.fontWeight = style.fontWeight;
    span.style.fontStyle = style.fontStyle;
    span.style.letterSpacing = style.letterSpacing;
    span.style.textTransform = style.textTransform;

    document.body.append(span);
    sizeIndex = sizeClasses.length - 1;

    for (let i = 0; i < sizeClasses.length; i += 1) {
      span.className = `${sizeClasses[i]} absolute invisible whitespace-nowrap pointer-events-none`;

      if (Math.ceil(span.getBoundingClientRect().width) <= availableWidth) {
        sizeIndex = i;
        break;
      }
    }

    span.remove();
  };

  onMount(updateTextSize);
</script>

<svelte:window on:resize={updateTextSize} />

<input
  bind:this={inputEl}
  use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() }}
  onblur={handleUpdateName}
  oninput={updateTextSize}
  class={`${styles({ isOwned })} ${sizeClasses[sizeIndex]}`}
  type="text"
  bind:value={newAlbumName}
  disabled={!isOwned}
  title={$t('edit_title')}
  placeholder={$t('add_a_title')}
/>

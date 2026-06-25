<script lang="ts">
  import {
    Button,
    Card,
    Column,
    Drawer,
    FadeInOut,
    Grid,
    IconButton,
    Image,
    Navigate,
    Marquee,
    Modal,
    type RouteComponentProps,
    Row,
    Skeleton,
    Text,
    Toast,
    View,
    Virtual,
    VirtualGrid,
    type ElementNode,
    type LightningComponent,
    FPSCounter,
  } from '../../src/index.js';

  const sections = [
    'Home',
    'Rows',
    'Grid',
    'Virtual',
    'Motion',
    'Primitives',
    'Effects',
  ];
  const sectionPaths = [
    'home',
    'rows',
    'grid',
    'virtual',
    'motion',
    'primitives',
    'effects',
  ];
  const heroCards = ['Continue', 'Profiles', 'Live TV'];
  const railItems = ['Drama', 'Comedy', 'Sports', 'Kids', 'News', 'Music'];
  const gridItems = Array.from(
    { length: 12 },
    (_, index) => `Tile ${index + 1}`,
  );
  const virtualGridItems = Array.from(
    { length: 36 },
    (_, index) => `Cell ${index + 1}`,
  );
  const virtualItems = Array.from(
    { length: 24 },
    (_, index) => `Rail ${index + 1}`,
  );

  let props: RouteComponentProps = $props();
  let activeSection = $derived(
    Math.max(0, sectionPaths.indexOf(props.params.section ?? 'home')),
  );
  let menu: LightningComponent | undefined;
  let content: LightningComponent | undefined;
  let virtualList = $state<LightningComponent | undefined>();
  let virtualGrid: LightningComponent | undefined;
  let motionOn = $state(true);
  let primitiveModalOpen = $state(false);
  let primitiveDrawerOpen = $state(false);
  let primitiveToastOpen = $state(false);

  const posterSrc =
    'https://static.vecteezy.com/system/resources/thumbnails/060/843/811/small/close-up-of-raindrops-on-leaves-hd-background-luxury-hd-wallpaper-image-trendy-background-illustration-free-photo.jpg';

  function focusContent() {
    content?.setFocus();
    return true;
  }

  function focusMenu() {
    menu?.setFocus();
    return true;
  }

  function selectSection(index: number) {
    props.navigate(`/${sectionPaths[index] ?? 'home'}`);
  }

  function toggleMotion() {
    motionOn = !motionOn;
    return true;
  }

  function openPrimitiveModal() {
    primitiveModalOpen = true;
    return true;
  }

  function closePrimitiveModal() {
    primitiveModalOpen = false;
    return true;
  }

  function openPrimitiveDrawer() {
    primitiveDrawerOpen = true;
    return true;
  }

  function closePrimitiveDrawer() {
    primitiveDrawerOpen = false;
    return true;
  }

  function showPrimitiveToast() {
    primitiveToastOpen = true;
    return true;
  }

  function hidePrimitiveToast() {
    primitiveToastOpen = false;
  }

  function surfaceColor(index: number) {
    return ['#1e293bff', '#334155ff', '#243b53ff', '#2f3a4aff'][index % 4];
  }

  function accentColor(index: number) {
    return ['#38bdf8ff', '#f59e0bff', '#22c55eff', '#e879f9ff'][index % 4];
  }

  function focusStyle(index: number, scale = 1.045) {
    return { $focus: { color: accentColor(index), scale } };
  }

  function onContentFocus(elm: ElementNode) {
    elm.selected = 0;
  }

  function focusVirtualGrid() {
    if (!virtualGrid) return false;
    virtualGrid?.setFocus();
    return true;
  }

  function focusVirtualList() {
    if (!virtualList) return false;
    virtualList?.setFocus();
    return true;
  }
</script>

{#if props.location.path === '/'}
  <Navigate href="/home" replace />
{/if}

<View w={1920} h={1080} color="#0b1020ff">
  <Text x={48} y={48} text="svelte-tv" fontSize={38} color="#f8fafcff" />
  <Text
    x={50}
    y={96}
    text="Lightning primitives"
    fontSize={18}
    color="#94a3b8ff"
  />

  <Column
    bind:this={menu}
    x={48}
    y={150}
    gap={14}
    autofocus
    selected={0}
    onRight={focusContent}
    onSelectedChanged={selectSection}
  >
    {#each sections as section, index}
      <View
        w={220}
        h={58}
        color={activeSection === index ? '#1f3a5fff' : '#1e293bff'}
        borderRadius={8}
        transition={{ color: true, scale: true }}
        style={{
          $focus: {
            color: '#38bdf8ff',
            scale: 1.035,
          },
        }}
      >
        <Text x={22} y={16} text={section} fontSize={24} color="#ffffffff" />
      </View>
    {/each}
  </Column>

  <View x={348} y={42} w={880} h={88} color="#111827ff" borderRadius={10}>
    <Text
      x={28}
      y={18}
      text={sections[activeSection]}
      fontSize={34}
      color="#f8fafcff"
    />
    <Marquee
      x={28}
      y={58}
      w={680}
      h={24}
      marquee
      text="Use arrows to move between primitives. Left returns to navigation when a row reaches its edge."
      speed={120}
      textProps={{ fontSize: 18, color: '#94a3b8ff' }}
    />
  </View>

  {#if activeSection === 0}
    <Column
      bind:this={content}
      x={348}
      y={158}
      gap={28}
      onLeft={focusMenu}
      onFocus={onContentFocus}
    >
      <Row gap={22}>
        {#each heroCards as title, index}
          <View
            w={260}
            h={132}
            color={surfaceColor(index)}
            borderRadius={10}
            transition={{ color: true, scale: true }}
            style={{ $focus: { color: accentColor(index), scale: 1.045 } }}
          >
            <Text x={24} y={24} text={title} fontSize={28} color="#ffffffff" />
            <Text
              x={24}
              y={72}
              text={`Focus card ${index + 1}`}
              fontSize={20}
              color="#e2e8f0ff"
            />
          </View>
        {/each}
      </Row>

      <Row gap={18}>
        {#each railItems as item, index}
          <View
            w={132}
            h={76}
            color="#1e293bff"
            borderRadius={8}
            transition={{ color: true, scale: true }}
            style={{ $focus: { color: accentColor(index), scale: 1.06 } }}
          >
            <Text x={18} y={24} text={item} fontSize={22} color="#ffffffff" />
          </View>
        {/each}
      </Row>

      <View w={820} h={154} color="#111827ff" borderRadius={10}>
        <Image
          x={18}
          y={18}
          w={220}
          h={124}
          src={posterSrc}
          color="#ffffffff"
        />
        <Text
          x={270}
          y={24}
          text="Image + Text + View"
          fontSize={28}
          color="#f8fafcff"
        />
        <Text
          x={270}
          y={68}
          text="Data URL texture path, nested text nodes, focusable rows, and canvas renderer defaults are exercised here."
          fontSize={19}
          maxWidth={500}
          contain="width"
          color="#cbd5e1ff"
        />
      </View>
    </Column>
  {/if}

  {#if activeSection === 1}
    <Column
      bind:this={content}
      x={348}
      y={158}
      gap={26}
      onLeft={focusMenu}
      onFocus={onContentFocus}
    >
      {#each ['Featured', 'Continue Watching', 'Live Channels'] as rowTitle, rowIndex}
        <View w={858} h={128}>
          <Text x={0} y={0} text={rowTitle} fontSize={24} color="#f8fafcff" />
          <Row x={0} y={42} gap={16}>
            {#each [0, 1, 2, 3] as card}
              <View
                w={188}
                h={78}
                color={surfaceColor(card + rowIndex)}
                borderRadius={8}
                transition={{ color: true, scale: true }}
                style={{
                  $focus: {
                    color: accentColor(card + rowIndex),
                    scale: 1.055,
                  },
                }}
              >
                <Text
                  x={18}
                  y={20}
                  text={`${rowTitle.slice(0, 4)} ${card + 1}`}
                  fontSize={22}
                  color="#ffffffff"
                />
              </View>
            {/each}
          </Row>
        </View>
      {/each}
    </Column>
  {/if}

  {#if activeSection === 2}
    <Grid
      bind:this={content}
      x={348}
      y={158}
      items={gridItems}
      columns={4}
      itemWidth={202}
      itemHeight={104}
      itemOffset={16}
      onLeft={focusMenu}
    >
      {#snippet children({ item, index, width, height, x, y })}
        <View
          {x}
          {y}
          w={width - 16}
          h={height - 16}
          color={surfaceColor(index)}
          borderRadius={8}
          transition={{ color: true, scale: true }}
          style={{ $focus: { color: accentColor(index), scale: 1.045 } }}
        >
          <Text x={18} y={18} text={item} fontSize={22} color="#ffffffff" />
          <Text
            x={18}
            y={52}
            text={`Grid index ${index}`}
            fontSize={16}
            color="#dbeafeff"
          />
        </View>
      {/snippet}
    </Grid>
  {/if}

  {#if activeSection === 3}
    <Column
      bind:this={content}
      x={348}
      y={158}
      gap={24}
      onLeft={focusMenu}
      onFocus={onContentFocus}
    >
      <View w={858} h={136} forwardFocus={focusVirtualList}>
        <Text x={0} y={0} text="Virtual Row" fontSize={24} color="#f8fafcff" />
        <Virtual
          bind:this={virtualList}
          x={0}
          y={42}
          each={virtualItems}
          displaySize={4}
          bufferSize={2}
          onLeft={focusMenu}
          onDown={focusVirtualGrid}
        >
          {#snippet children({ item, index })}
            <View
              w={154}
              h={78}
              color={surfaceColor(index)}
              borderRadius={8}
              transition={{ color: true, scale: true }}
              style={{ $focus: { color: accentColor(index), scale: 1.055 } }}
            >
              <Text x={16} y={18} text={item} fontSize={20} color="#ffffffff" />
              <Text
                x={16}
                y={46}
                text={`Index ${index}`}
                fontSize={15}
                color="#dbeafeff"
              />
            </View>
          {/snippet}
        </Virtual>
      </View>

      <View w={858} h={282} forwardFocus={focusVirtualGrid}>
        <Text x={0} y={0} text="Virtual Grid" fontSize={24} color="#f8fafcff" />
        <VirtualGrid
          bind:this={virtualGrid}
          x={0}
          y={42}
          each={virtualGridItems}
          columns={5}
          rows={2}
          onLeft={focusMenu}
          onUp={focusVirtualList}
        >
          {#snippet children({ item, index, x, y })}
            <View
              {x}
              {y}
              w={146}
              h={82}
              color={surfaceColor(index)}
              borderRadius={8}
              transition={{ color: true, scale: true }}
              style={{ $focus: { color: accentColor(index), scale: 1.05 } }}
            >
              <Text x={16} y={22} text={item} fontSize={19} color="#ffffffff" />
            </View>
          {/snippet}
        </VirtualGrid>
      </View>
    </Column>
  {/if}

  {#if activeSection === 4}
    <Column
      bind:this={content}
      x={348}
      y={158}
      gap={24}
      onLeft={focusMenu}
      onFocus={onContentFocus}
    >
      <Row gap={18}>
        <View
          w={280}
          h={100}
          color={motionOn ? '#22c55eff' : '#475569ff'}
          borderRadius={10}
          transition={{ color: true, scale: true }}
          onEnter={toggleMotion}
          style={{ $focus: { color: '#f59e0bff', scale: 1.045 } }}
        >
          <Text
            x={22}
            y={22}
            text="Fade toggle"
            fontSize={24}
            color="#ffffffff"
          />
          <Text
            x={22}
            y={58}
            text={motionOn ? 'Enter hides panel' : 'Enter shows panel'}
            fontSize={18}
            color="#f8fafcff"
          />
        </View>

        <FadeInOut
          when={motionOn}
          w={420}
          h={100}
          color="#1e293bff"
          borderRadius={10}
        >
          <Text
            x={22}
            y={22}
            text="FadeInOut mounted"
            fontSize={24}
            color="#f8fafcff"
          />
          <Text
            x={22}
            y={58}
            text="This panel animates on create and destroy."
            fontSize={18}
            color="#cbd5e1ff"
          />
        </FadeInOut>
      </Row>

      <Row gap={18}>
        {#each [0, 1, 2, 3] as index}
          <View
            w={170}
            h={132}
            color="#1e293bff"
            borderRadius={10}
            transition={{ color: true, scale: true, alpha: true }}
            alpha={index === 3 ? 0.72 : 1}
            style={{
              $focus: {
                color: accentColor(index),
                scale: 1.08,
                alpha: 1,
              },
            }}
          >
            <Text
              x={20}
              y={24}
              text={`State ${index + 1}`}
              fontSize={23}
              color="#ffffffff"
            />
            <Text
              x={20}
              y={66}
              text="color scale alpha"
              fontSize={16}
              color="#e2e8f0ff"
            />
          </View>
        {/each}
      </Row>

      <View w={820} h={88} color="#111827ff" borderRadius={10}>
        <Marquee
          x={24}
          y={30}
          w={760}
          h={32}
          marquee
          text="Marquee primitive: long text scrolls inside a clipped Lightning view without DOM rendering."
          speed={150}
          textProps={{ fontSize: 22, color: '#ffffffff' }}
        />
      </View>
    </Column>
  {/if}

  {#if activeSection === 5}
    <Column
      bind:this={content}
      x={348}
      y={158}
      gap={24}
      onLeft={focusMenu}
      onFocus={onContentFocus}
    >
      <Row gap={18}>
        <Button
          padding={16}
          color="#1e293bff"
          borderRadius={8}
          transition={{ color: true, scale: true }}
          style={focusStyle(0)}
          onEnter={openPrimitiveModal}
        >
          <Text text="Open modal" fontSize={24} color="#ffffffff" />
        </Button>
        <Button
          padding={16}
          color="#1e293bff"
          borderRadius={8}
          transition={{ color: true, scale: true }}
          style={focusStyle(1)}
          onEnter={openPrimitiveDrawer}
        >
          <Text text="Open drawer" fontSize={24} color="#ffffffff" />
        </Button>
        <IconButton
          padding={12}
          color="#1e293bff"
          borderRadius={8}
          transition={{ color: true, scale: true }}
          style={focusStyle(2)}
          revealPlacement="right"
          onEnter={showPrimitiveToast}
        >
          {#snippet icon()}
            <Text text="+" fontSize={30} color="#ffffffff" />
          {/snippet}
          <Text text="Toast" fontSize={24} color="#ffffffff" />
        </IconButton>
        <Button
          padding={16}
          color="#1e293bff"
          borderRadius={8}
          alpha={0.45}
          disabled
        >
          <Text text="Disabled" fontSize={24} color="#ffffffff" />
        </Button>
      </Row>

      <Row gap={18}>
        <Card
          w={250}
          h={132}
          color="#1e293bff"
          borderRadius={8}
          transition={{ color: true, scale: true }}
          style={focusStyle(0)}
          onEnter={showPrimitiveToast}
        >
          <Text text="CARD" fontSize={16} color="#bfdbfeff" />
          <Text text="Focusable" fontSize={26} color="#ffffffff" />
          <Text text="Enter shows toast" fontSize={18} color="#dbeafeff" />
        </Card>
        <Card
          w={250}
          h={132}
          color="#2563ebff"
          borderRadius={8}
          transition={{ color: true, scale: true }}
          style={focusStyle(1)}
        >
          <Text text="SELECTED" fontSize={16} color="#bfdbfeff" />
          <Text text="Active state" fontSize={26} color="#ffffffff" />
          <Text text="Caller styled" fontSize={18} color="#dbeafeff" />
        </Card>
        <Card
          w={250}
          h={132}
          color="#1e293bff"
          borderRadius={8}
          alpha={0.45}
          disabled
        >
          <Text text="DISABLED" fontSize={16} color="#bfdbfeff" />
          <Text text="Skipped" fontSize={26} color="#ffffffff" />
          <Text text="Not focusable" fontSize={18} color="#dbeafeff" />
        </Card>
      </Row>

      <View
        w={820}
        h={138}
        color="#111827ff"
        borderRadius={10}
        display="flex"
        alignItems="center"
        padding={22}
        gap={24}
      >
        <Skeleton
          w={86}
          h={86}
          variant="circle"
          color="#334155ff"
          alpha={0.55}
        />
        <Skeleton
          w={300}
          h={18}
          variant="text"
          rows={3}
          color="#334155ff"
          alpha={0.55}
          borderRadius={4}
        />
        <Skeleton
          w={300}
          h={90}
          rows={2}
          color="#334155ff"
          alpha={0.55}
          borderRadius={8}
        />
      </View>
    </Column>
  {/if}

  {#if activeSection === 6}
    <Column
      bind:this={content}
      x={348}
      y={158}
      gap={24}
      onLeft={focusMenu}
      onFocus={onContentFocus}
    >
      <Row gap={22}>
        <View
          w={250}
          h={150}
          color="#162033ff"
          borderRadius={26}
          border={{ width: 5, color: '#38bdf8ff' }}
          transition={{ color: true, scale: true }}
          style={{ $focus: { color: '#1f3a5fff', scale: 1.045 } }}
        >
          <Text x={22} y={24} text="Border" fontSize={24} color="#ffffffff" />
          <Text
            x={22}
            y={68}
            text="borderRadius + border"
            fontSize={18}
            color="#cbd5e1ff"
          />
        </View>

        <View
          w={250}
          h={150}
          color="#111827ff"
          borderRadius={18}
          borderLeft={{ width: 22, color: '#f8fafcff' }}
          borderRight={{ width: 4, color: '#f8fafcff' }}
          borderTop={{ width: 12, color: '#f8fafcff' }}
          borderBottom={{ width: 4, color: '#f8fafcff' }}
          transition={{ color: true, scale: true }}
          style={{ $focus: { color: '#1f2937ff', scale: 1.045 } }}
        >
          <Text x={22} y={24} text="Sides" fontSize={24} color="#ffffffff" />
          <Text
            x={22}
            y={68}
            w={190}
            text="left/top are thicker"
            fontSize={18}
            color="#dbeafeff"
            contain="width"
          />
        </View>

        <View
          w={250}
          h={150}
          color="#000000ff"
          borderRadius={28}
          border={{ width: 2, color: '#ffffffff' }}
          shadow={{
            color: '#ffffffff',
            blur: 46,
            x: 0,
            y: 0,
          }}
          transition={{ color: true, scale: true }}
          style={{ $focus: { color: '#111827ff', scale: 1.045 } }}
        >
          <View
            x={18}
            y={18}
            w={214}
            h={114}
            color="#334155ff"
            borderRadius={18}
          />
          <Text x={32} y={32} text="Shadow" fontSize={24} color="#ffffffff" />
          <Text
            x={32}
            y={76}
            w={170}
            text="white glow"
            fontSize={18}
            color="#e2e8f0ff"
            contain="width"
          />
        </View>
      </Row>

      <Row gap={22}>
        <View
          w={390}
          h={170}
          borderRadius={18}
          linearGradient={{
            angle: Math.PI * 0.75,
            width: 390,
            height: 170,
            stops: [0, 0.58, 1],
            colors: [0x38bdf8ff, 0x1e293bff, 0x0f172aff],
          }}
          transition={{ scale: true }}
          style={{ $focus: { scale: 1.035 } }}
        >
          <Text
            x={24}
            y={28}
            text="Linear gradient"
            fontSize={28}
            color="#ffffffff"
          />
          <Text
            x={24}
            y={76}
            w={310}
            text="angle, stops, colors"
            fontSize={20}
            color="#e0f2feff"
            contain="width"
          />
        </View>

        <View
          w={390}
          h={170}
          borderRadius={18}
          radialGradient={{
            pivot: [0.5, 0.5],
            w: 390,
            h: 170,
            stops: [0, 0.28, 1],
            colors: [0xfef08aff, 0xf59e0bff, 0x1e1b4bff],
          }}
          transition={{ scale: true }}
          style={{ $focus: { scale: 1.035 } }}
        >
          <Text
            x={24}
            y={28}
            text="Radial gradient"
            fontSize={28}
            color="#ffffffff"
          />
          <Text
            x={24}
            y={76}
            w={305}
            text="pivot, stops, colors"
            fontSize={20}
            color="#fde68aff"
            contain="width"
          />
        </View>
      </Row>
    </Column>
  {/if}

  <Modal
    open={primitiveModalOpen}
    overlayColor="#00000099"
    onClose={closePrimitiveModal}
    panelProps={{
      color: '#111827ff',
      borderRadius: 10,
      gap: 16,
      forwardFocus: 2,
    }}
  >
    <Text
      w={380}
      h={40}
      text="Modal primitive"
      fontSize={30}
      color="#f8fafcff"
    />
    <Text
      w={380}
      h={56}
      text="Backspace, Escape, or the focused button closes this overlay."
      fontSize={19}
      contain="width"
      color="#cbd5e1ff"
    />
    <Button
      padding={14}
      color="#1e293bff"
      borderRadius={8}
      transition={{ color: true, scale: true }}
      style={focusStyle(1)}
      onEnter={closePrimitiveModal}
    >
      <Text text="Close" fontSize={24} color="#ffffffff" />
    </Button>
  </Modal>

  <Drawer
    open={primitiveDrawerOpen}
    side="right"
    overlayColor="#00000077"
    onClose={closePrimitiveDrawer}
    panelProps={{
      color: '#111827ff',
      gap: 18,
      forwardFocus: 1,
    }}
  >
    <Text text="Drawer" fontSize={30} color="#f8fafcff" />
    <Column gap={16}>
      <Button
        padding={14}
        color="#1e293bff"
        borderRadius={8}
        transition={{ color: true, scale: true }}
        style={focusStyle(0)}
        onEnter={closePrimitiveDrawer}
      >
        <Text text="Close drawer" fontSize={24} color="#ffffffff" />
      </Button>
      <Card
        w={260}
        h={116}
        color="#1e293bff"
        borderRadius={8}
        transition={{ color: true, scale: true }}
        style={focusStyle(2)}
      >
        <Text text="PANEL" fontSize={16} color="#bfdbfeff" />
        <Text text="Focusable item" fontSize={24} color="#ffffffff" />
        <Text text="Lives inside drawer" fontSize={17} color="#dbeafeff" />
      </Card>
    </Column>
  </Drawer>

  <Toast
    open={primitiveToastOpen}
    x={420}
    y={590}
    color="#111827ee"
    borderRadius={8}
    shadow={{
      color: '#00000066',
      blur: 18,
      x: 0,
      y: 8,
    }}
    padding={18}
    gap={4}
    duration={2200}
    onClose={hidePrimitiveToast}
  >
    <Text text="Toast primitive" fontSize={22} color="#ffffffff" />
    <Text
      text="Auto hides after 2.2 seconds."
      fontSize={17}
      color="#cbd5e1ff"
    />
  </Toast>
</View>
